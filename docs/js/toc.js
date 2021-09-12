/**
 * Creates a table of contents inside the given element.
 */
function maketoc(element, enableSections)
{
	enableSections = (enableSections != null) ? enableSections : true;
	let tmp = crawlDom(document.body, 2, 4, [], 30, enableSections);
	
	if (tmp.childNodes.length > 0)
	{
		element.appendChild(tmp);
	}
}

function crawlDom(parent, ignore, depth, chapters, indent, enableSections)
{
	let doc = parent.ownerDocument;
	let toc = doc.createElement('ul');
	toc.style.listStyleType = 'none';
	let child = parent.firstChild;
	let lastLevel = 0;
	
	while (child != null)
	{
		let name = child.nodeName.toLowerCase();

		if (name.substring(0, 1) == 'h')
		{
			let tmp = name.substring(1, name.length);
			let currentLevel = parseInt(tmp);
			
			// Checks if rest of string is numeric and
			// header level is not beyond depth
			if (currentLevel == tmp && (depth == 0 || currentLevel <= depth))
			{
				// Deletes chapter numbers which are no longer used
				if (currentLevel < lastLevel)
				{
					chapters = chapters.slice(0, currentLevel + 1);
				}
				
				lastLevel = currentLevel;

				if (ignore <= 0)
				{
					if (chapters[currentLevel] == null)
					{
						chapters[currentLevel] = 0;
					}

					chapters[currentLevel]++;
					let sect = '';
					
					for (let i = 0; i < chapters.length; i++)
					{
						if (chapters[i] != null)
						{
							sect += chapters[i] + '.';
						}
					}

					let tmp = child.firstChild;
					
					while (tmp != null &&
						tmp.nodeType != 3)
					{
						tmp = tmp.nextSibling;
					}
					
					if (tmp != null)
					{
						sect = sect.substring(0, sect.length - 1);
						let title = tmp.nodeValue;
						let anchor = null;
						
						if (navigator.userAgent.indexOf('MSIE') >= 0)
						{
							// Setting the name tag here is a workaround for IE which sets the
							// submitName attribute instead when using setAttribute('name', sect)
							anchor = doc.createElement('<a name="'+sect+'"></a>');
						}
						else
						{
							anchor = doc.createElement('a');
							anchor.setAttribute('name', sect);
						}
						
						if (enableSections)
						{
							anchor.appendChild(doc.createTextNode(sect+' '));
						}
						
						child.insertBefore(anchor, tmp);
						
						// Adds entry in the table of contents
						let listItem = doc.createElement('li');
						listItem.style.paddingLeft = ((currentLevel - 1) * indent) + 'px';
						var anchor2 = doc.createElement('a');
						anchor2.setAttribute('href', '#'+sect);
						
						if (enableSections)
						{
							anchor2.appendChild(doc.createTextNode(sect + ' ' + title));
						}
						else
						{
							anchor2.appendChild(doc.createTextNode(title));
						}
						
						listItem.appendChild(anchor2);
						toc.appendChild(listItem);
					}
				}
				else
				{
					ignore--;
				}
			}
		}

		let tmp = crawlDom(child, 0, depth, chapters, indent);
		
		if (tmp.childNodes.length > 0)
		{
			toc.appendChild(tmp);
		}
		
		child = child.nextSibling;
	}

	return toc;
}
