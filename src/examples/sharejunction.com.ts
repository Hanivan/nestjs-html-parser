import { HtmlParserService } from '../';

const html = `
<!DOCTYPE html>
<html>
<head>
<title>Page Title</title>
</head>
<body>
<table width="500px" class="table table-striped table-bordered dataTable no-footer" id="forumTable" summary="Table contains the updated stock and share forum topic discussions">
	<thead>
		<tr>
			<th width="150">Forum Title</th>
			<th>Topic</th>
			<th width="50">Views</th>
			<th width="50">Replies</th>
			<th width="65">Rating</th>
			<th width="80">Last Post</th>
		</tr>
	</thead>
	<tbody>
		
			<tr>
				<td><a href="listTopic.htm?msgbd=35126&amp;msgbdName=Wilton Resources">Wilton Resources</a> </td>
				<td><a href="listMessage.htm?topicId=12044&amp;searchString=&amp;msgbdName=Wilton Resources&amp;topicTitle=Wilton Resources (5F7) ">
						Wilton Resources (5F7) 
				</a></td>
				<td>216693</td>
				<td>1383</td>
				<td>
						
						
						
							<img src="pages/images/rating_3.gif">
						
						
						
						
					</td>
				<td>12-Sep 19:58</td>
			</tr>
		
	</tbody>
</table></body>
</html>`;

async function demonstrateSharejunctionParser() {
  const parser = new HtmlParserService();

  try {
    const results = parser.extractStructuredList(
      html,
      `//table[@id='forumTable']/tbody/tr`,
      {
        link: {
          selector: './td[2]//a/@href',
          type: 'xpath',
        },
        title: {
          selector: './td[2]//a/text()[normalize-space()]',
          type: 'xpath',
        },
        views: {
          selector: './td[3]/text()[normalize-space()]',
          type: 'xpath',
        },
        replies: {
          selector: './td[4]/text()[normalize-space()]',
          type: 'xpath',
        },
        date: {
          selector: './td[6]/text()[normalize-space()]',
          type: 'xpath',
        },
      },
      'xpath',
      { verbose: true },
    );
    console.log('Results:', results);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateSharejunctionParser()
    .then(() => console.log('\nSharejunction parsing demo completed!'))
    .catch(console.error);
}

export { demonstrateSharejunctionParser };
