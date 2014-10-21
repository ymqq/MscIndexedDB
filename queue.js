
// 思路：
// 执行队列：
// queue属性负责保存所有任务；
// 在任务执行中，任务完成后自己发起执行下一任务命令



var ExecQueue = function() {
	var that = this,
		DOING = 'doing',
		END = 'end';
	that._fx = [];
	that._state = DOING; // 'doing','end'
	that.queue = function(task) {
		console.info('Add a task <%s> into queue.', JSON.stringify(task));
		that._fx.push(task);
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

function Test() {
	var that = this,
		queue = new ExecQueue();
	that.test1 = function(args) {
		var fn = function(args) {
			var timeout = args[0];
			console.log('Test1 is excuted delay at %ss later.', timeout);
			setTimeout(function() {
				console.log('----------Execute Test1 Successfully--------------');
				queue.dequeue();
			}, timeout);
		};

		queue.queue({'name':fn, 'args': arguments});
	};
	that.test2 = function(args) {
		var fn = function(args) {
			var timeout = args[0];
			console.log('Test2 is excuted delay at %s later.', timeout);
			setTimeout(function() {
				console.log('----------Execute Test2 Successfully--------------');
				queue.dequeue();
			}, timeout);
		};
		queue.queue({'name':fn, 'args': arguments});
	};
	that.test3 = function(args) {
		var fn = function(args) {
			var timeout = args[0];
			console.log('Test3 is excuted delay at %s later.', timeout);
			setTimeout(function() {
				console.log('----------Execute Test3 Successfully--------------');
				queue.dequeue();
			}, timeout);
		};
		queue.queue({'name':fn, 'args': arguments});
	};
	that.test4 = function(args) {
		var fn = function(args) {
			var timeout = args[0];
			console.log('Test4 is excuted delay at %s later.', timeout);
			setTimeout(function() {
				console.log('----------Execute Test4 Successfully--------------');
				queue.dequeue();
			}, timeout);
		};
		queue.queue({'name':fn, 'args': arguments});
	};
	that.test5 = function(args) {			
		var fn = function(args) {
			var timeout = args[0];
			console.log('Test5 is excuted delay at %s later.', timeout);
			setTimeout(function() {
				console.log('----------Executed Test5 Successfully--------------');
				queue.dequeue();
			}, timeout);
		};
		queue.queue({'name':fn, 'args': arguments});
	};
	that.start = function() {
		queue.dequeue();
	};
	that.abort = function(callback) {
		queue.abort(callback);
	};
}

window.onload = function() {
var test = new Test();

test.test1(450);
test.test3(1200);
test.test4(900);
test.test2(5000);
test.test1(100);
test.test5(3000);
test.start();
setTimeout(function() {
	test.abort(function() {
		console.warn('------Abort Successfully!!!--------');
		console.info('-----Start other queue task--------');
		test.test5(450);
		test.test4(1200);
		test.test5(900);
		test.start();
	});
}, 5000);

};
