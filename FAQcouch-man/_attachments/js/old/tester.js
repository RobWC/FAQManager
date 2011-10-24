var articleView = {
	id: this._id,
	rev: this_rev,
	question: FAQ.textRenderer('Q: ' + this.question, '', '<div/>'),
	answer: FAQ.textRenderer('A: ' + this.answer, '', '<div/>'),
	category: 'Category: ' + this.category.toString(), 
	lastupdate: 'Last Updated: ' + lastUpdateDateFormatted
};

var articleTemplate = '<article id={{id}} class="record" data-rev={{rev}}>\
<div id="question">{{question}}</div>\
<div id="answer">{{answer}}</div>\
<div id="category">{{category}}</div>\
<div id="last-update">{{lastupdate}}</div>\
<footer>\
	<nav>\
		<ul>\
			<li id="detail">\
				<button id="detail_button" class="infoButton">Detail</button>\
			</li>\
		</ul>\
	</nav>\
</article>';
/*
                        .append($('<div id="question"/>').append(FAQ.textRenderer('Q: ' + this.question, '', '<div/>')))
                        .append($('<div id="answer"/>').append(FAQ.textRenderer('A: ' + this.answer, '', '<div/>')))
                        .append($('<div>', {id:"category"}).text('Category: ' + this.category.toString()))
                        .append($('<div/>',{id:'last-update'}).append('Last Updated: ' + lastUpdateDateFormatted))
                        .append(
                            $('<footer/>').append(
                            		$('<nav/>').append(
                            		$('<ul/>').append(
                            				$('<li id="detail"/>')
                                        .append($('<button id="detail_button" class="infoButton">Detail</button>').button()))
                                    )
                                )
                            );
  */      //attach event ot detail