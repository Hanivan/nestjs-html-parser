import { HtmlParserService } from '../';

// Example transform pipe class (similar to your PathAppendPipe)
// Supports different append modes:
// - 'after-base': Inserts pathSegment after base URL but before existing path
// - 'after-path': Appends pathSegment after existing path or after specific path
class ExampleTransformPipe {
  pathSegment: string;
  appendMode: 'after-base' | 'after-path' = 'after-path'; // Default to append after existing path
  afterPath?: string; // Specific path to append after (only used when appendMode is 'after-path')

  transform(val: any) {
    if (typeof val !== 'object' || !val.href) return val;

    try {
      const urlObj = new URL(val.href, 'https://example.com');

      // Ensure the pathSegment starts with a slash
      let segment = this.pathSegment;
      if (!segment.startsWith('/')) {
        segment = '/' + segment;
      }

      if (this.appendMode === 'after-base') {
        // Append directly after base URL (keep existing path)
        let currentPath = urlObj.pathname;
        if (currentPath.startsWith('/')) {
          currentPath = currentPath.substring(1); // Remove leading slash
        }
        urlObj.pathname = segment + (currentPath ? '/' + currentPath : '');
      } else {
        // Append after existing path or specific path
        let currentPath = urlObj.pathname;

        if (this.afterPath) {
          // Check if current path contains the specified afterPath
          const afterPathIndex = currentPath.indexOf(this.afterPath);
          if (afterPathIndex !== -1) {
            // Insert the segment after the specified path
            const beforePath = currentPath.substring(0, afterPathIndex + this.afterPath.length);
            const afterPathPart = currentPath.substring(afterPathIndex + this.afterPath.length);
            urlObj.pathname = beforePath + segment + afterPathPart;
          } else {
            // If afterPath not found, append to the end
            if (currentPath.endsWith('/')) {
              currentPath = currentPath.slice(0, -1);
            }
            urlObj.pathname = currentPath + segment;
          }
        } else {
          // Append to the end of current path
          if (currentPath.endsWith('/')) {
            currentPath = currentPath.slice(0, -1);
          }
          urlObj.pathname = currentPath + segment;
        }
      }

      return {
        ...val,
        href: urlObj.toString(),
      };
    } catch (error) {
      // If URL parsing fails, return original value
      return val;
    }
  }
}

const html = `
<!DOCTYPE html>
<html>
<head>
<title>Page Title</title>
</head>
<body>
<table width="100%" id="bsWrapper">
	<tbody><tr>
		<td align="left"><span class="msg"> <b>Topic List
					(Sorted By Date)</b> &nbsp;&nbsp;&nbsp;&nbsp; <a href="listLatestTopics.htm?recordCount=0">First</a>
				&nbsp; 
					<a href="listLatestTopics.htm?recordCount=0">&lt;
						Newer</a> &nbsp;
			 <b>51-100 of 5065 </b> &nbsp; 
					<a href="listLatestTopics.htm?recordCount=100">Older&gt;</a> &nbsp;
			 <a href="listLatestTopics.htm?recordCount=5050">Last
			</a> &nbsp;
		</span></td>
		<td align="right"> 
				<b><font face="Wingdings" size="4" color="#6600CC">*</font></b>&nbsp;<a href="login.htm"><font color="red"><b>Post New Topic</b></font></a>
			 &nbsp; &nbsp;</td>
	</tr>
</tbody></table>

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

    // Extract pagination with transform - append after existing path
    console.log('\n--- Pagination Extraction (append after path) ---');
    const pagination1 = parser.extractPagination(
      html,
      "//table[@id='bsWrapper']//span",
      'xpath',
      {
        baseUrl: 'https://sharejunction.com',
        transform: {
          class: ExampleTransformPipe,
          payload: {
            pathSegment: '/forums',
            appendMode: 'after-path' // Default: append after existing path
          },
        },
        verbose: true,
      },
    );
    console.log('Pagination (after-path):', pagination1);

    // Extract pagination with transform - append after base URL
    console.log('\n--- Pagination Extraction (append after base) ---');
    const pagination2 = parser.extractPagination(
      html,
      "//table[@id='bsWrapper']//span",
      'xpath',
      {
        baseUrl: 'https://sharejunction.com',
        transform: {
          class: ExampleTransformPipe,
          payload: {
            pathSegment: '/api/forums',
            appendMode: 'after-base' // Insert after base URL, keep existing path
          },
        },
        verbose: false, // Reduce logging for second example
      },
    );
    console.log('Pagination (after-base):', pagination2);

    // Extract pagination with transform - append after specific path
    console.log('\n--- Pagination Extraction (append after specific path) ---');
    const pagination3 = parser.extractPagination(
      html,
      "//table[@id='bsWrapper']//span",
      'xpath',
      {
        baseUrl: 'https://sharejunction.com',
        transform: {
          class: ExampleTransformPipe,
          payload: {
            pathSegment: '/v2',
            appendMode: 'after-path',
            afterPath: 'listLatestTopics.htm' // Insert after this specific path
          },
        },
        verbose: false,
      },
    );
    console.log('Pagination (after specific path):', pagination3);
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
