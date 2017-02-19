module.exports = {};
let lang = require('./lang.json').EN,
	escape = require("html-escape");

function genField(name, label, el, type, value, display){
		return `
<div class="mui-textfield mui-textfield--float-label" ${display ? `style="display: ${display}"` : ''}>
	<${el} ${type ? `type="${type}"` : ''} name="${name}" ${value ? `value="${value}"` : ''}></${el}>
	<label>${label}</label>
</div>`
}

module.exports = {
	genForm(board, thread){
		return `
<form class="mui-form post-form" action="/post.js" method="POST">
	<legend>${thread ? lang.form.post : lang.form.thread}</legend>
	${genField('name', lang.form.name, 'input', 'text')}
	${thread ? '' : genField('subject', lang.form.subject, 'input', 'text')}
	${genField('text', lang.form.msg, 'textarea')}
	${genField('board', '', 'input', 'text', board, 'none')}
	${genField('thread', '', 'input', 'text', thread, 'none')}
	<div class="mui-checkbox">
		<label>
			<input name="sage" type="checkbox">
			${lang.form.sage}
		</label>
	</div>
	<div class="mui-checkbox">
		<label>
			<input name="opMark" type="checkbox">
			${lang.form.op}
		</label>
	</div>
	<button type="submit" class="mui-btn mui-btn--raised">Submit</button>
</form>`;
	},
	
	genHead(){
		return `
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="//cdn.muicss.com/mui-0.9.9/css/mui.min.css" rel="stylesheet" type="text/css" />
    <script src="//cdn.muicss.com/mui-0.9.9/js/mui.min.js"></script>
	<script src="/NodeChan.js"></script>
    <link href="/NodeChan.css" rel="stylesheet" type="text/css" />
</head>
<body>`
	},
	genTopHTML(board, thread){
		return `${module.exports.genHead()}<div class="mui-container">${module.exports.genForm(board, thread)}`
	},
	
	genBottomHTML(board, thread){
		return `${module.exports.genForm(board, thread)}</div></body>`;
	},
	
	insertHTML(html, board, thread){
		return `${module.exports.genTopHTML(board, thread)}${html}${module.exports.genBottomHTML(board, thread)}`;
	},
	
	genPostHTML(post){
		let time = new Date(post.timestamp*1000);
		return `
<div class="post-wrapper" data-id="${post.id}">
	<div class="mui-panel post" data-id="${post.id}">
		<div class="mui--z1 post-header">
			<span class="post-author">${post.name}</span>
			<span class="post-time" date-timestamp="${post.timestamp}">${time.toLocaleDateString()} ${time.toLocaleTimeString()}</span>
			${post.subject ? `<span class="post-subject">${post.subject}</span>` : ''}
			<span class="post-id">#${post.id}</span>
			${post.op ? `<span class="post-op">✔️️</span>` : ''}
		</div>
		${post.images ? `<div class="post-images"></div><!-- TODO: images! -->` : ''}
		<div class="post-body">${escape(post.text)}</div>
	</div>
</div>`
	}
}