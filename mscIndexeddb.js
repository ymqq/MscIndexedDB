/**
 * 
 */



'use strict';
var MscIDBModule = MscIDBModule || {
	_db: null,
	objStore: null
};

// ExecQueue Object.
/**
* Func Name: ExecQueue
* Func Disc: 任务执行队列对象，
* 			功能：将任务push到任务列表中，每个任务实现同样的调用方式，一个任务执行完后，再shift出一个任务继续执行。
* 			方法与属性：_fx----任务队列
* 		 				_state----当前任务执行到的状态
* 		 				queue----将任务push到_fx中
* 		 				dequeue----将_fx中的任务shift出一个去执行
* 		 				abort----当_state=END的时候，终止继续执行下面的任务，同时清空_fx
* 		     说明：由于整个代码编写机制，都基于任务队列执行对象处理流程，
* 		     		所以之后编写MscIDBModule都必须基于该机制编写模式，编写程序。
* Parameters：
* Author: ChenQq
* Date: 2014-10-07 17:30
* Update Author: ChenQq
* Update Date: 2014-10-07 17:30
**/
'use strict';
(function(MscIDBModule) {
	var ExecQueue = function() {
		var that = this,
			DOING = 'doing',
			END = 'end';
		that._fx = [];
		that._state = DOING; // 'doing','end'
		that.queue = function(fn, args) {
			console.info('Add a task <%s> into queue.', JSON.stringify(args));
			that._fx.push({name: fn, args: args});
		};
		that.dequeue = function() {
			var task = that._fx.shift();
			if(task) {
				that._state = DOING;
				task.args ? task.name(task.args) : task.name();
			} else {
				that._state = END;
			}
		};
		that.abort = function(callback) {
			that._fx = [];
			var timer = setInterval(function() {
				if(END === that._state) {
					callback && callback();
					clearInterval(timer);
				}
			}, 50);
		};
	};

	var execQueue = new ExecQueue();
	MscIDBModule._queue = function(fn, args) {
		execQueue.queue(fn, args);
	};
	MscIDBModule._dequeue = function() {
		execQueue.dequeue();
	};
	MscIDBModule.startQueue = function() {
		MscIDBModule._dequeue();
	};
	MscIDBModule.abortQueue = function(callback) {
		execQueue.abort(callback);
	};
})(MscIDBModule);

// Tool Object.
/**
* Func Name: Tool
* Func Disc: 从jQuery中分离出来的extend方法，用于扩展对象；同时还涉及到几个需要用的小工具方法，也一并提取出来。
* 			方法与属性：extend----扩展对象方法，与jQuery用法一致
* 		 				isPlainObject----判断对象是否为简单对象，只有简单对象才能进行扩展
* 		 				isWindow----判断是否为window对象
* 		 				type----判断对象类型，返回类型名称
* Parameters：
* Author: ChenQq
* Date: 2014-10-07 17:30
* Update Author: ChenQq
* Update Date: 2014-10-07 17:30
**/
(function(MscIDBModule) {
	var Tool = {
		extend: function() {
			var options, name, src, copy, copyIsArray, clone,
				target = arguments[0] || {},
				i = 1,
				length = arguments.length,
				deep = false;

			// Handle a deep copy situation
			if ( typeof target === "boolean" ) {
				deep = target;
				// skip the boolean and the target
				target = arguments[ i ] || {};
				i++;
			}
			// Handle case when target is a string or something (possible in deep copy)
			if ( typeof target !== "object" && !Tool.isFunction(target) ) {
				target = {};
			}
			// extend window itself if only one argument is passed
			if ( i === length ) {
				target = this;
				i--;
			}
			for ( ; i < length; i++ ) {
				// Only deal with non-null/undefined values
				if ( (options = arguments[ i ]) != null ) {
					// Extend the base object
					for ( name in options ) {
						src = target[ name ];
						copy = options[ name ];
						// Prevent never-ending loop
						if ( target === copy ) {
							continue;
						}
						// Recurse if we're merging plain objects or arrays
						if ( deep && copy && ( Tool.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
							if ( copyIsArray ) {
								copyIsArray = false;
								clone = src && Array.isArray(src) ? src : [];
							} else {
								clone = src && Tool.isPlainObject(src) ? src : {};
							}
							// Never move original objects, clone them
							target[ name ] = Tool.extend( deep, clone, copy );
						// Don't bring in undefined values
						} else if ( copy !== undefined ) {
							target[ name ] = copy;
						}
					}
				}
			}
			// Return the modified object
			return target;
		},
		isPlainObject: function( obj ) {
			var hasOwn = ({}).hasOwnProperty;
			// Not plain objects:
			// - Any object or value whose internal [[Class]] property is not "[object Object]"
			// - DOM nodes
			// - window
			if ( Tool.type( obj ) !== "object" || obj.nodeType || Tool.isWindow( obj ) ) {
				return false;
			}
			if ( obj.constructor &&
					!hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
				return false;
			}
			// If the function hasn't returned already, we're confident that
			// |obj| is a plain object, created by {} or constructed with new Object
			return true;
		},
		isWindow: function(obj) {
			return obj != null && obj === obj.window;
		},
		type: function(obj) {
			var class2type = {},
				toString = class2type.toString;
			if ( obj == null ) {
				return obj + "";
			}
			return typeof obj === "object" || typeof obj === "function" ?
				class2type[ toString.call(obj) ] || "object" :
				typeof obj;
		}
	};

	MscIDBModule.tool = _extendClass(Tool);
})(MscIDBModule);

// IndexedDB open, close and delete function
'use strict';
(function(MscIDBModule) {
	// only open with current version.
	// openDB(dbname);
	// version is equal or large current version, the action open with argument version, only open with version.
	// openDB(dbname, version);
	// Note: This method is not open for caller.
	// version must be large current version, the action open with argument version, open with new version to update IDB.
	// openDB(dbname, version, callback);
	// 如果没有传version参数，该动作就被当作仅仅打开IndexedDB动作，并且不提供回调。
	/**
	* Func Name: openDB
	* Func Disc: 根据参数情况，执行不同的打开IDB。说明：该方法是MscIDBModule执行动作的必须方法。
	* Param：dbName---IDB名称
	* Param：version---IDB版本号，必须为正整数，可选
	* Param：callback---回调函数，回调中的参数为：IDBRequest；当前只能在对IDB进行update动作的时候，支持回调
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function openDB(dbName, version, callback) {
		var fn = function() {
			var args = arguments[0],
				dbName = args[0],
				version = args[1],
				callback = args[2],
				request = null;
			// fix arguments version and callback
			if('function' === typeof(version)) {
				callback = version;
				version = null;
			}
			if(version) {
				request = indexedDB.open(dbName, version);
			} else {
				request = indexedDB.open(dbName);
			}
			request.onupgradeneeded = function(evt) {
				var transaction = request.transaction;
				MscIDBModule._db = request.result;
				console.warn('&&&&&&&&&&&----------onupgradeneeded-----------' + request.readyState);
				callback && callback(request);
				transaction.oncomplete = function() {
					console.warn('&&&&&&&&&&&----------transaction.oncomplete-----------' + request.readyState);
					MscIDBModule._dequeue();
				};
			};
			request.onsuccess = function(evt) {
				console.warn('&&&&&&&&&&&----------onsuccess-----------' + request.readyState);
				MscIDBModule._db = request.result;
				// callback && callback(request);
				MscIDBModule._dequeue();
			};

			request.onerror = function(evt) {
				MscIDBModule._db = null;
				throw Error(evt.currentTarget.error);
			};
		};
		MscIDBModule._queue(fn, arguments);
	}

	/**
	* Func Name: deleteDB
	* Func Disc: 删除dbName对应的IDB
	* Param：dbName---IDB名称
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function deleteDB(dbName) {
		var fn = function() {
			var request = indexedDB.deleteDatabase(dbName);
			request.onsuccess = function(evt) {
				console.warn('!!!!----%s was deleted successfully!-----', dbName);
				MscIDBModule._db = null;
				MscIDBModule._dequeue();
			};
			request.onerror = function(evt) {
				throw Error(evt.currentTarget.error);
			};
		};
		MscIDBModule._queue(fn, arguments);
	}

	/**
	* Func Name: closeDB
	* Func Disc: 关闭当前打开的数据库
	* Param：dbName---IDB名称
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function closeDB() {
		var fn = function() {
			var request = null;
			if(MscIDBModule._db) {
				request = MscIDBModule._db.close();
				request.onsuccess = function(evt) {
					console.warn('---------IndexedDB is closed successfully!---------');
					MscIDBModule._db = null;
					MscIDBModule._dequeue();
				};
			} else {
				console.error('----------Current no IndexedDB is open, so which does not need to be closed!---------');
				MscIDBModule._dequeue();
			}
		};
		MscIDBModule._queue(fn);
	}

	MscIDBModule.open = openDB;
	MscIDBModule.closeDB = closeDB;
	MscIDBModule.deleteDB = deleteDB;
})(MscIDBModule);

/***************************************************************************
*					从此处开始，定义实现操作objectStore方法
***************************************************************************/

// IndexedDB insert service functions
// store add and put.
'use strict';
(function(MscIDBModule) {
	MscIDBModule.objStore = MscIDBModule.objStore || {};

	// add(storename, {});
	// add(storename, {}, 1);
	/**
	* Func Name: add
	* Func Disc: 往对应的ObjectStore中插入一条数据
	* Param：storeName---store名称
	* Param：value---需要插入的数据
	* Param：key---插入的数据对应的key，可选
	* Param：callback---插入数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function add(storeName, value, key, callback) {
		var fn = function() {
			var args = arguments[0],
				storeName = args[0],
				value = args[1],
				key = args[2],
				callback = arguments[3],
				trans = MscIDBModule._db.transaction(storeName, 'readwrite'),
				store = trans.objectStore(storeName),
				request = null;
			// fixed arguments key and callback
			if('function' === typeof(key)) {
				callback = key;
				key = null;
			}
			request = key ? store.add(value, key) : store.add(value);
			trans.oncomplete = function(evt) {
				console.info('----------Store Data is added successfully!!!---------');
				callback && callback();
				MscIDBModule._dequeue();
			};
			trans.onerror = function(evt) {
				console.error('----------Store Data is added failure!!!---------');
				throw Error(evt.currentTarget.error);
			};
		};
		MscIDBModule._queue(fn, arguments);
	}

	// put(storename, [{},{}]);
	/**
	* Func Name: put
	* Func Disc: 往对应的ObjectStore中插入多条数据
	* Param：storeName---store名称
	* Param：set---需要插入的数据集合
	* Param：callback---插入数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function put(storeName, set, callback) {
		var fn = function() {
			var args = arguments[0],
				storeName = args[0],
				set = args[1],
				callback = args[2],
				trans = MscIDBModule._db.transaction(storeName, 'readwrite'),
				store = trans.objectStore(storeName);
			for(var i in set) {
				var temp = set[i],
					value = temp.value,
					key = temp.key;
				key ? store.put(value, key) : store.put(value);
			}
			trans.oncomplete = function(evt) {
				console.info('----------Store Data is added successfully!!!---------');
				callback && callback();
				MscIDBModule._dequeue();
			};
			trans.onerror = function(evt) {
				console.error('----------Store Data is added failure!!!---------');
			};
		};
		MscIDBModule._queue(fn, arguments);
	}

	
	MscIDBModule.objStore.add = add;
	MscIDBModule.objStore.put = put;
})(MscIDBModule);


// IndexedDB delete service functions
// store 
'use strict';
(function(MscIDBModule) {
	MscIDBModule.objStore = MscIDBModule.objStore || {};

	/**
	* Func Name: deleteByKey
	* Func Disc: 从对应的ObjectStore中删除一条数据
	* Param：storeName---store名称
	* Param：key---需要删除的数据对应的key
	* Param：callback---删除数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function deleteByKey(storeName, key, callback) {
		var fn = function() {
			var args = arguments[0],
				storeName = args[0],
				key = args[1],
				callback = args[2],
				trans = MscIDBModule._db.transaction(storeName, 'readwrite'),
				store = trans.objectStore(storeName),
				request = null;
			// fixed arguments key and callback
			if('function' === typeof(key)) {
				callback = key;
				key = null;
			}
			request = store.delete(key);
			request.onsuccess = function(evt) {
				console.log('---------Delete data in store(%storeName) by key(%s) successfully---------', storeName, key);
			};
			trans.oncomplete = function(evt) {
				callback && callback();
				MscIDBModule._dequeue();
			};
			trans.onerror = function(evt) {
				throw new Error(evt.currentTarget.error);
			};
		};
		MscIDBModule._queue(fn, arguments);
	}


	/**
	* Func Name: clear
	* Func Disc: 清空对应的ObjectStore中的数据
	* Param：storeName---store名称
	* Param：callback---删除数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function clear(storeName, callback) {
		var fn = function() {
			var args = arguments[0],
				storeName = args[0],
				callback = args[1],
				trans = MscIDBModule._db.transaction(storeName, 'readwrite'),
				store = trans.objectStore(storeName),
				request = store.clear();
			request.onsuccess = function(evt) {
				console.warn('-------Clear store(%s) successfully---------', storeName);
			};
			trans.oncomplete = function(evt) {
				callback && callback();
				MscIDBModule._dequeue();
			};
			trans.onerror = function(evt) {
				throw new Error(evt.currentTarget.error);
			};
		};
		MscIDBModule._queue(fn, arguments);
	}


	MscIDBModule.objStore.deleteByKey = deleteByKey;
	MscIDBModule.objStore.clear = clear;
})(MscIDBModule);

// IndexedDB query service functions
// store get, openCursor and count
'use strict';
(function(MscIDBModule) {
	MscIDBModule.objStore = MscIDBModule.objStore || {};

	// ObjectStore get function only return the first existing value
	/**
	* Func Name: getByKey
	* Func Disc: 从对应的ObjectStore中查询key对应的一条数据
	* Param：storeName---store名称
	* Param：key---需要查询的数据对应的key
	* Param：callback---查询数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function getByKey(storeName, key, callback) {
		var fn = function() {
			var args = arguments[0],
				storeName = args[0],
				key = args[1],
				callback = args[2],
				trans = MscIDBModule._db.transaction(storeName, 'readonly'),
				store = trans.objectStore(storeName),
				request = store.get(key);
			request.onsuccess = function(evt) {
				var data = request.result;
				callback && callback(data);
			};

 			trans.oncomplete = function(evt) {
 				console.info('---------Get data by key: %s successfully!!!---------', key);
 				MscIDBModule._dequeue();
 			};
 			trans.onerror = function(evt) {
 				throw Error(evt.currentTarget.error);
 			};
		};
		MscIDBModule._queue(fn, arguments);
	}

	// ObjectStore get function only return the first existing value
	/**
	* Func Name: getByIndex
	* Func Disc: 使用索引，从对应的ObjectStore中查询key对应的一条数据
	* Param：storeName---store名称
	* Param: name---索引名称
	* Param：key---需要查询的数据对应的索引的key
	* Param：callback---查询数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function getByIndex(storeName, name, key, callback) {
		var fn = function() {
			var args = arguments[0],
				storeName = args[0],
				name = args[1],
				key = args[2],
				callback = args[3],
				trans = MscIDBModule._db.transaction(storeName, 'readonly'),
				store = trans.objectStore(storeName),
				index = store.index(name),
				request = index.get(key);
			request.onsuccess = function(evt) {
				var data = request.result;
				callback && callback(data);
			};

 			trans.oncomplete = function(evt) {
 				console.info('---------Get data by index key: %s successfully!!!---------', key);
 				MscIDBModule._dequeue();
 			};
 			trans.onerror = function(evt) {
 				throw Error(evt.currentTarget.error);
 			};
		};
		MscIDBModule._queue(fn, arguments);
	}

	/**
	* Func Name: getListByKey
	* Func Disc: 从对应的ObjectStore中查询key对应的多条数据
	* Param：storeName---store名称
	* Param：key---需要查询的数据对应的key
	* Param: direction---游标方向，可选
	* Param：callback---查询数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function getListByKey(storeName, key, direction, callback) {
		var fn = function() {
			var args = arguments[0],
				storeName = args[0],
				key = args[1],
				direction = args[2],
				callback = args[3],
				trans = MscIDBModule._db.transaction(storeName, 'readonly'),
				store = trans.objectStore(storeName),
				request = null,
				list = [];
			// fixed argument direction and callback
			if('function' === typeof(direction)) {
				callback = direction;
				direction = 'next';
			}
			request = store.openCursor(key, direction);
			request.onsuccess = function(evt) {
				var cursor = request.result;
				if(cursor) {
					list.push(cursor.value);
					cursor.continue();
				}
			};
			trans.oncomplete = function(evt) {
				console.info('---------Get dataList by key: %s successfully!!!---------', key);
				callback && callback(list);
				MscIDBModule._dequeue();
			};
			trans.onerror = function(evt) {
				throw Error(evt.currentTarget.error);
			};
		};
		MscIDBModule._queue(fn, arguments);
	}

	/**
	* Func Name: getAllByKey
	* Func Disc: 从对应的ObjectStore中查询所有数据
	* Param：storeName---store名称
	* Param: direction---游标方向
	* Param：callback---查询数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function getAllByKey(storeName, direction, callback) {
		getListByKey(storeName, null, direction, callback);
	}

	/**
	* Func Name: getListByIndex
	* Func Disc: 使用索引，从对应的ObjectStore中查询key对应的多条数据
	* Param：storeName---store名称
	* Param: name---索引名称
	* Param: key---需要查询数据对应的key
	* Param: direction---游标方向，可选
	* Param：callback---查询数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function getListByIndex(storeName, name, key, direction, callback) {
		var fn = function() {
			var args = arguments[0],
				storeName = args[0],
				name = args[1],
				key = args[2],
				direction = args[3],
				callback = args[4],
				trans = MscIDBModule._db.transaction(storeName, 'readonly'),
				store = trans.objectStore(storeName),
				index = store.index(name),
				request = null,
				list = [];
			// fixed argument direction and callback
			if('function' === typeof(direction)) {
				callback = direction;
				direction = 'next';
			}
			request = index.openCursor(key, direction);
			request.onsuccess = function(evt) {
				var cursor = request.result;
				if(cursor) {
					list.push(cursor.value);
					cursor.continue();
				}
			};
			trans.oncomplete = function(evt) {
				console.info('---------Get dataList by Index: %s successfully!!!---------', key);
				callback && callback(list);
				MscIDBModule._dequeue();
			};
			trans.onerror = function(evt) {
				throw Error(evt.currentTarget.error);
			};
		};
		MscIDBModule._queue(fn, arguments);
	}

	/**
	* Func Name: getAllByIndex
	* Func Disc: 使用索引，从对应的ObjectStore中查询所有数据
	* Param：storeName---store名称
	* Param: name---索引名称
	* Param: direction---游标方向，可选
	* Param：callback---查询数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function getAllByIndex(storeName, name, direction, callback) {
		getListByIndex(storeName, name, null, direction, callback);
	}

	/**
	* Func Name: countByKey
	* Func Disc: 从对应的ObjectStore中，统计key对应的数据记录数量
	* Param：storeName---store名称
	* Param: key---需要查询数据对应的key
	* Param：callback---统计数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function countByKey(storeName, key, callback) {
		var fn = function() {
			var args = arguments[0],
				storeName = args[0],
				key = args[1],
				callback = args[2],
				trans = MscIDBModule._db.transaction(storeName, 'readonly'),
				store = trans.objectStore(storeName),
				request = key ? store.count(key) : store.count();
			request.onsuccess = function(evt) {
				var count = request.result;
				callback && callback(count);
			};
			trans.oncomplete = function() {
				console.info('-------Count record number by key(%s) from store(%s) successfully-------', key, storeName);
				MscIDBModule._dequeue();
			};
			trans.onerror = function(evt) {
				throw new Error(evt.currentTarget.error);
			};
		};
		MscIDBModule._queue(fn, arguments);
	}

	/**
	* Func Name: count
	* Func Disc: 从对应的ObjectStore中，统计所有数据记录数量
	* Param：storeName---store名称
	* Param：callback---统计数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function count(storeName, callback) {
		countByKey(storeName, null, callback);
	}

	// index count 
	/**
	* Func Name: countIndexByKey
	* Func Disc: 从对应的ObjectStore中，统计key对应的索引数据记录数量
	* Param：storeName---store名称
	* Param: name---索引名称
	* Param: key---需要查询数据对应的key
	* Param：callback---统计数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function countIndexByKey(storeName, name, key, callback) {
		var fn = function() {
			var args = arguments[0],
				storeName = args[0],
				name = args[1],
				key = args[2],
				callback = args[3],
				trans = MscIDBModule._db.transaction(storeName, 'readonly'),
				store = trans.objectStore(storeName),
				index = store.index(name),
				request = key ? index.count(key) : index.count();
			request.onsuccess = function(evt) {
				var count = request.result;
				callback && callback(count);
			};
			trans.oncomplete = function(evt) {
				console.info('-------Count index by key(%s) in store(%s) successfully---------', key, storeName);
				MscIDBModule._dequeue();
			};
			trans.onerror = function(evt) {
				throw new Error(evt.currentTarget.error);
			};
		};
		MscIDBModule._queue(fn, arguments);
	}

	/**
	* Func Name: countIndex
	* Func Disc: 从对应的ObjectStore中，统计所有的索引数据记录数量
	* Param：storeName---store名称
	* Param: name---索引名称
	* Param：callback---统计数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function countIndex(storeName, name, callback) {
		countIndexByKey(storeName, name, null, callback);
	}

	MscIDBModule.objStore.getByKey = getByKey;
	MscIDBModule.objStore.getByIndex = getByIndex;
	MscIDBModule.objStore.getListByKey = getListByKey;
	MscIDBModule.objStore.getAllByKey = getAllByKey;
	MscIDBModule.objStore.getListByIndex = getListByIndex;
	MscIDBModule.objStore.getAllByIndex = getAllByIndex;
	MscIDBModule.objStore.countByKey = countByKey;
	MscIDBModule.objStore.count = count;
	MscIDBModule.objStore.countIndexByKey = countIndexByKey;
	MscIDBModule.objStore.countIndex = countIndex;
})(MscIDBModule);

// IndexedDB update service function
// store data update
(function() {
	MscIDBModule.objStore = MscIDBModule.objStore || {};

	/**
	* Func Name: countIndex
	* Func Disc: 修改对应的ObjectStore中，key对应的数据记录
	* Param：storeName---store名称
	* Param: key---需要修改的数据对应的key
	* Param: data---新数据对象
	* Param：callback---统计数据完成后的回调函数，可选
	* 
	* Author: ChenQq
	* Date: 2014-10-14 10:30
	* Update Author: ChenQq
	* Update Date: 2014-10-14 10:30
	**/
	function updateByKey(storeName, key, data, callback) {
		var fn = function() {
			var args = arguments[0],
				storeName = args[0],
				key = args[1],
				data = args[2],
				callback = args[3],
				trans = MscIDBModule._db.transaction(storeName, 'readwrite'),
				store = trans.objectStore(storeName),
				request = store.get(key);
			request.onsuccess = function(evt) {
				var old = request.result,
					tool = new MscIDBModule.tool(),
					updateRequest = null;
				old = tool.extend(true, {}, old, data);
				updateRequest = store.put(data);
				updateRequest.onsuccess = function(evt) {
					console.log('-------put new data successfully----------');
				};
				updateRequest.onerror = function(evt) {
					throw new Error(evt.currentTarget.error);
				};
			};
			trans.oncomplete = function(evt) {
				console.info('---------update data by key: %s successfully!!!---------', key);
				callback && callback();
 				MscIDBModule._dequeue();
			};
			trans.onerror = function(evt) {
				throw new Error(evt.currentTarget.error);
			};
		};
		MscIDBModule._queue(fn, arguments);
	}

	MscIDBModule.objStore.updateByKey = updateByKey;
})();


function _extendClass(o) {
	function F() {}
	F.prototype = o;
	return F;
}

'use strict';
var MscIndexedDB = _extendClass(MscIDBModule);





