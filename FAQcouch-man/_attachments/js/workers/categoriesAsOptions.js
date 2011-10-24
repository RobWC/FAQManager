self.addEventListener('message', function(e) {
	var selfWorker = this;
	var data = e.data;
	switch (data.cmd) {
	case 'start':
		//send data back with this - self.postMessage('WORKER STARTED: ' + data.msg);
		if (!!data.documentID || data.documentID != '') {
			//get category list from document
			var categoryList = new Object();
			var documentReq = new XMLHttpRequest();
			documentReq.open('GET','/faq/' + data.documentID);
			documentReq.onreadystatechange = function() {
				if (documentReq.readyState === 4 && documentReq.status === 200) {
					var response = new Object();
					response = JSON.parse(documentReq.responseText);
					if (!!response.category) {
						var categoryList = response.category; //documents categories
						var categoriesReq = new XMLHttpRequest();
						categoriesReq.open('GET','/faq/_design/FAQcouch/_view/categories?reduce=false');
						categoriesReq.onreadystatechange = function() {
							if (categoriesReq.readyState === 4 && categoriesReq.status === 200) {
								var returnInfo = new Array();
								info = JSON.parse(categoriesReq.responseText).rows;
								var match;
								for (var i in info) {
									match = false;
									for (var x in categoryList) {
										if (categoryList[x] == info[i].value.categoryName) {
											match = true;
										};
									};
									if (match == true) {
										//make it selected as it matched
										returnInfo.push('<option selected="selected" value="' + info[i].value.categoryName + '">' + info[i].value.categoryName + '</option>');
									} else if (match == false) {
										//make it unselected as it was not matched
										returnInfo.push('<option value="' + info[i].value.categoryName + '">' + info[i].value.categoryName + '</option>');
									};
								};
								self.postMessage(returnInfo);
							};
						};
						categoriesReq.send(null);
					};
				};
			};
			documentReq.send(null);
		} else {
			//just return unselected categories
			var categoriesReq = new XMLHttpRequest();
			categoriesReq.open('GET','/faq/_design/FAQcouch/_view/categories?reduce=false');
			categoriesReq.onreadystatechange = function() {
				if (categoriesReq.readyState === 4 && categoriesReq.status === 200) {
					var returnInfo = new Array();
					info = JSON.parse(categoriesReq.responseText).rows;
					for (var i in info) { 	      		
						returnInfo.push('<option value="' + info[i].value.categoryName + '">' + info[i].value.categoryName + '</option>');
					};
					self.postMessage(returnInfo);
				};
			};
			categoriesReq.send(null); 
		};
		//grab id of documnent
		//grab categories
		//map categories to existing categories of document
		//pass elements back as jquery entries
		break;
	case 'stop':
		self.postMessage('WORKER STOPPED');
		self.close(); // Terminates the worker.
		break;
	default:
		self.postMessage('Unknown command: ' + data.msg);
	};
}, false);