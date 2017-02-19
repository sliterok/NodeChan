const language = 'EN',
	  port = 3000;

let express = require('express'),
	  bodyParser = require('body-parser'),
	  multipart = require('multiparty'),
	  cookieParser = require('cookie-parser'),
	  _ = require('lodash'),
	  html = require('./boardhtml.js')(language),
	  lang = require('./lang.json')[language],
	  fs = require('fs');


//let multipartM = multipart();

let app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(__dirname + '/resources'));

setInterval((e)=>{
	fs.writeFile(__dirname + '/server.json', JSON.stringify(server), function(err) {
		if(err) {
			return console.log(err);
		}
	}); 
}, 10000);

class Server{
	constructor(){
		this.boardList = [
			{name: 'Random', short: 'b'},
			{name: 'Dev', short: 'd'}
		];
		this.boards = {};
		this.port = port || 80;
	}
	
	boot(){
		app.post(`/post.js`, (req, res) => {
			let board = req.body.board,
				thread = req.body.thread || 0;
			
			if(!board) res.send({code: -1, note: lang.boardNotFound});
			else if(!req.body.text && req.files.length < 1) res.send({code: -3, note: lang.emptyMessageWithoutFiles});
			else {
				let timeNow = getUnixTime();
				let sendObj = {
					id: ++this.boards[board].postCount
				};
				if(thread == 0){
					let opHash = ((Math.random() + 1)*5).toString(36).substring(2, 30);
						thread = sendObj.id;
					
					this.boards[board].threads[thread] = new Thread(
						opHash,
						new Post({
							text: req.body.text,
							name:  req.body.name || lang.default.name,
							subject: req.body.subject || req.body.text.split(' ').slice(0, 5).join(' '),
							timestamp: timeNow,
							files: req.files, //TODO: make this actually work!
							sage: req.body.sage,
							op: req.body.opMark || false,
							id: sendObj.id,
						})
					);
					res.cookie(`op_of_${thread}`, opHash, {maxAge: 1000 * 60 * 60 * 24 * 5}) //5 days
					sendObj.opHash = opHash;
					sendObj.newThread = true;
					res.status(302);
					res.append('Location', `/${board}/${thread}.html`);
				} else {
					this.boards[board].threads[thread].posts.push(new Post({
						text: req.body.text,
						name:  req.body.name || 'Anonymous',
						timestamp: timeNow,
						files: req.files, //TODO: make this actually work!
						sage: req.body.sage,
						op: (this.boards[board].threads[thread].opHash == req.cookies[`op_of_${sendObj.id}`] && req.body.opMark) || false,
						id: sendObj.id,
					}));
					res.status(302);
					res.append('Location', `/${board}/${thread}.html`);
				}
				if(!req.body.sage) this.boards[board].threads[thread].bumpTime = timeNow;
				sendObj.code = 0;
				sendObj.note = lang.success;
				res.send(sendObj);
			}
				
		});
		
		this.boardList.forEach((el)=>{
			this.boards[el.short] = new Board(el.name, el.short);
			app.get(`/:board`, (req, res) => {
				if(!this.boards.hasOwnProperty(req.params.board)) return;
				res.send(html.insertHTML(`<ul>${_.reduce(this.boards[req.params.board].threads, (accum, e) => {
					return accum += `<div class="mui-panel thread">${_.reduce(e.getLatestPosts(), (acc, el) => {
						return acc += html.genPostHTML(el);
					}, '')}</div>`
				}, '')}</ul>`, req.params.board));//TODO: more html here
			});
			app.get(`/:board/:thread.json`, (req, res) => {
				if(!this.boards.hasOwnProperty(req.params.board) || !this.boards[req.params.board].threads.hasOwnProperty(req.params.thread)){
					res.sendStatus('404');
					return;
				}
				res.send(JSON.stringify(this.boards[req.params.board].threads[req.params.thread].posts));
			})
			app.get(`/:board/:thread.html`, (req, res) => {
				if(!this.boards.hasOwnProperty(req.params.board) || !this.boards[req.params.board].threads.hasOwnProperty(req.params.thread)){
					res.sendStatus('404');
					return;
				}
				
				let board = this.boards[req.params.board],
					thread = board.threads[req.params.thread];
					
				res.send(html.insertHTML(`<div class="mui-panel thread">${_.reduce(thread.posts, (accum, el) => {
					return accum += html.genPostHTML(el);
				}, '')}</div>`, req.params.board, req.params.thread));//TODO: more html
			})
		});
		
		app.get(`/`, (req, res) => {
			res.send(`<ul>${_.reduce(this.boardList, (accum, e) => {
				return accum += `<li><a href="/${e.short}" >/${e.short}/</a> - ${e.name}</li>`
			}, '')}</ul>`);//TODO: more html here
		});
		
		app.listen(this.port, () => {
		  console.log(`NodeBoard is working on port ${this.port}`);
		});
	}
}

class Board{
	constructor(name, short) {
		this.name = name;
		this.short = short;
		this.threads = {};
		this.postCount = 0;
	}
}

class Thread{
	constructor(opHash, opPost) {
		this.id = opPost.id;
		this.posts = [opPost];
		this.opHash = opHash;
		this.bumpTime = opPost.timestamp;
	}
	
	getLatestPosts(){
		return this.posts.slice(-3)
	}
	
	getOpPost(){
		return this.posts.slice(0, 1)
	}
}

class Post{
	constructor(post) {
		this.name = post.name;
		this.subject = post.subject;
		this.text = post.text;
		this.files = post.files; //TODO: make this actually work!
		this.timestamp = post.timestamp;
		this.id = post.id;
		this.op = post.op;
		this.sage = post.sage
	}
}

const server = new Server();
server.boot();

function getUnixTime(){
	return Math.round((new Date()).getTime()/1000)
}