// 


var DBNAME = 'testDB';
var storeNames = ['books', 'authors'];
var version = 1;
var start;

window.onload = function() {
	var $ = function(s) {return document.querySelector(s);},
		// 一下使用id的变量，在最新的浏览器中都可以不需要（$）获取就可以直接使用
		// 如下面注释掉的两个变量，据说是遗留的烂属性，未找到相关说明，待审查
		btn_openDB = $('#btn_openDB'),
		btn_deleteDB = $('#btn_deleteDB'),
		btn_createBookStore = $('#btn_createBookStore'),
		btn_deleteBookStore = $('#btn_deleteBookStore'),
		btn_addOneData = $('#btn_addOneData'),
		btn_putManyData = $('#btn_putManyData'),
		btn_getByKey = $('#btn_getByKey'),
		btn_getByIndex = $('#btn_getByIndex'),
		btn_getListByKey = $('#btn_getListByKey'),
		btn_getAllByKey = $('#btn_getAllByKey'),
		btn_getListByIndex = $('#btn_getListByIndex'),
		btn_getAllByIndex = $('#btn_getAllByIndex'),
		btn_deleteByKey = $('#btn_deleteByKey'),
		btn_clear = $('#btn_clear'),
		btn_countByKey = $('#btn_countByKey'),
		btn_countAll = $('#btn_countAll'),
		btn_updateByKey = $('#btn_updateByKey'),
		mscIndexedDB = new MscIndexedDB();


	btn_openDB.onclick = function(e) {
		mscIndexedDB.open(DBNAME, function() {
			console.info('-----------open db -------------------');
		});
		mscIndexedDB.startQueue();
	};
	btn_deleteDB.onclick = function(e) {
		mscIndexedDB.deleteDB(DBNAME);
		mscIndexedDB.startQueue();
	};
	btn_createBookStore.onclick = function(e) {
		version = 2;
		start = new Date().getTime();
		mscIndexedDB.open(DBNAME, version, function(request) {
			var db = request.result;
			console.log('-----------open db with version %s---------', version);
			var store = db.createObjectStore("books", {keyPath: "isbn", autoIncrement: true});
			var titleIndex = store.createIndex("by_title", "title", {unique: true});
			var authorIndex = store.createIndex("by_author", "author");
			console.log('cost time --->' + (new Date().getTime() - start));
		});
		mscIndexedDB.startQueue();
	};
	btn_deleteBookStore.onclick = function(e) {
		version = 3;
		mscIndexedDB.open(DBNAME, version);
		var time = new Date().getTime(),
			key = 1413203;
		mscIndexedDB.objStore.get(storeNames[0], key, function(data) {
			console.log('cost time --->' + (new Date().getTime() - time));
			console.log('data---->%s', JSON.stringify(data));
		});
		var data = {title: "Quarry Memories" + time, author: "Fred", isbn: 14132443};
		mscIndexedDB.objStore.add(storeNames[0], data, function() {
			console.log('cost time --->' + (new Date().getTime() - time));
		});
		mscIndexedDB.startQueue();
	};
	btn_addOneData.onclick = function(e) {
		var time = new Date().getTime(),
			data = {title: "Quarry Memories" + time, author: "Fred", isbn: 1413203};
		mscIndexedDB.open(DBNAME, function() {
			console.info('-----------open db -------------------');
		});
		mscIndexedDB.objStore.add(storeNames[0], data, function() {
			console.log('cost time --->' + (new Date().getTime() - time));
		});
		mscIndexedDB.startQueue();
	};
	btn_putManyData.onclick = function(e) {
		var time = new Date().getTime(),
			set = [{value: {title: "Quarry Memories " + time, author: "Fred", isbn: (time + 1)}},
				   {value: {title: "Water Buffaloes " + time, author: "Fred", isbn: (time + 2)}},
				   {value: {title: "Bedrock Nights " + time, author: "Barney", isbn: (time + 3)}}];
		// 3000: cost time --->1000 10045 22925 10752 
		// 30000: cost time --->6442
		// 300000: cost time --->68052
		// 操作效率记录：
		// 	如果是全新创建IDB：
		// 		3000条数据插入大概：800ms
		set = [];
		for(var i = 0; i < 10000; i++) {
			var d1 = {value: {title: time + '***' + i + "---Quarry Memories", author: "Fred", isbn: (time + 1) + '***' + i}}, // i + '***' + 
				d2 = {value: {title: time + '***' + i + "---Water Buffaloes", author: "Fred", isbn: (time + 2) + '***' + i}},
				d3 = {value: {title: time + '***' + i + "---Bedrock Nights", author: "Barney", isbn: (time + 3) + '***' + i}};
			set.push(d1, d2, d3);
		}
		time = new Date().getTime();
		mscIndexedDB.open(DBNAME, function() {
			console.info('-----------open db -------------------');
		});
		mscIndexedDB.objStore.put(storeNames[0], set, function() {
			console.log('cost time --->' + (new Date().getTime() - time));
		});
		mscIndexedDB.startQueue();
	};
	btn_getByKey.onclick = function(e) {
		var time = new Date().getTime(),
			key = 1413203;
		mscIndexedDB.open(DBNAME, function() {
			console.log('------------open db --------------------');
		});
		mscIndexedDB.objStore.getByKey(storeNames[0], IDBKeyRange.upperBound(key), function(data) {
			console.log('cost time --->' + (new Date().getTime() - time));
			console.log('data---->%s', JSON.stringify(data));
		});
		mscIndexedDB.startQueue();
	};
	btn_getByIndex.onclick = function(e) {
		var time = new Date().getTime(),
			key = 'Fred';
		mscIndexedDB.open(DBNAME, function() {
			console.log('------------open db --------------------');
		});
		mscIndexedDB.objStore.getByIndex(storeNames[0], 'by_author', key, function(data) {
			console.log('cost time --->' + (new Date().getTime() - time));
			console.log('data---->%s', JSON.stringify(data));
		});
		mscIndexedDB.startQueue();
	};
	btn_getListByKey.onclick = function(e) {
		var time = new Date().getTime(),
			key = 1413203,
			direction = 'next';
		mscIndexedDB.open(DBNAME, function() {
			console.log('------------open db --------------------');
		});
		mscIndexedDB.objStore.getListByKey(storeNames[0], key, direction, function(data) {
			console.log('cost time --->' + (new Date().getTime() - time));
			console.log('List data---->%s', JSON.stringify(data));
		});
		mscIndexedDB.startQueue();
	};
	btn_getAllByKey.onclick = function(e) {
		var time = new Date().getTime(),
			direction = 'next';
		mscIndexedDB.open(DBNAME, function() {
			console.log('------------open db --------------------');
		});
		mscIndexedDB.objStore.getAllByKey(storeNames[0], direction, function(data) {
			console.log('cost time --->' + (new Date().getTime() - time));
			console.log('All data---->%s', JSON.stringify(data));
		});
		mscIndexedDB.startQueue();
	};
	btn_getListByIndex.onclick = function(e) {
		var time = new Date().getTime(),
			key = 'Fred';
		mscIndexedDB.open(DBNAME, function() {
			console.log('------------open db --------------------');
		});
		mscIndexedDB.objStore.getListByIndex(storeNames[0], 'by_author', key, function(data) {
			console.log('cost time --->' + (new Date().getTime() - time));
			console.log('data---->%s', JSON.stringify(data));
		});
		mscIndexedDB.startQueue();
	};
	btn_getAllByIndex.onclick = function(e) {
		var time = new Date().getTime(),
			direction = 'next';
		mscIndexedDB.open(DBNAME, function() {
			console.log('------------open db --------------------');
		});
		mscIndexedDB.objStore.getAllByIndex(storeNames[0], 'by_author', direction, function(data) {
			console.log('cost time --->' + (new Date().getTime() - time));
			console.log('All data---->%s', JSON.stringify(data));
		});
		mscIndexedDB.startQueue();
	};
	btn_deleteByKey.onclick = function(e) {
		var time = new Date().getTime(),
			key = 1413203;
		mscIndexedDB.open(DBNAME, function() {
			console.log('------------open db --------------------');
		});
		mscIndexedDB.objStore.deleteByKey(storeNames[0], key, function() {
			console.log('cost time --->' + (new Date().getTime() - time));
		});
		mscIndexedDB.startQueue();
	};
	btn_clear.onclick = function(e) {
		var time = new Date().getTime();
		mscIndexedDB.open(DBNAME, function() {
			console.log('------------open db --------------------');
		});
		mscIndexedDB.objStore.clear(storeNames[0], function() {
			console.log('cost time --->' + (new Date().getTime() - time));
		});
		mscIndexedDB.startQueue();
	};
	btn_countByKey.onclick = function(e) {
		var time = new Date().getTime(),
			key = 1413203;
		mscIndexedDB.open(DBNAME, function() {
			console.log('------------open db --------------------');
		});
		mscIndexedDB.objStore.countByKey(storeNames[0], key, function(count) {
			console.log('cost time --->' + (new Date().getTime() - time));
			console.log('Count record by key(%s) is %s.', key, count);
		});
		mscIndexedDB.startQueue();
	};
	btn_countAll.onclick = function(e) {
		var time = new Date().getTime();
		mscIndexedDB.open(DBNAME);
		mscIndexedDB.objStore.count(storeNames[0], function(count) {
			console.log('cost time --->' + (new Date().getTime() - time));
			console.log('Count all record is %s.', count);
		});
		mscIndexedDB.startQueue();
	};
	btn_updateByKey.onclick = function(e) {
		var time = new Date().getTime(),
			key = 1413203;
		var data = {title: "Chenqq Quarry Memories" + time, author: "Fred-0000", isbn: 1413203};
		mscIndexedDB.open(DBNAME);
		mscIndexedDB.objStore.updateByKey(storeNames[0], key, data, function() {
			console.log('cost time --->' + (new Date().getTime() - time));
		});
		mscIndexedDB.startQueue();
	};
	btn_countIndexByKey.onclick = function(e) {
		var time = new Date().getTime(),
			key = 'Barney';
		mscIndexedDB.open(DBNAME);
		mscIndexedDB.objStore.countIndexByKey(storeNames[0], 'by_author', key, function(count) {
			console.log('cost time --->' + (new Date().getTime() - time));
			console.log('Count index by IndexKey(%s) is: %s', key, count);
		});
		mscIndexedDB.startQueue();
	};
	btn_countIndexAll.onclick = function(e) {
		var time = new Date().getTime();
		mscIndexedDB.open(DBNAME);
		mscIndexedDB.objStore.countIndex(storeNames[0], 'by_author', function(count) {
			console.log('cost time --->' + (new Date().getTime() - time));
			console.log('Count index is: %s', count);
		});
		mscIndexedDB.startQueue();
	};
};



console.log('435260934873290438570293487509283');