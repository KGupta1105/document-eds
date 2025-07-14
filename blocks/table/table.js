export default async function decorate(block) {
  console.log('Initializing robust table block');

  // Extract JSON URL from block content
  const textContent = block.textContent.trim();
  console.log('Block text content:', textContent);

  if (!textContent.includes('.json')) {
    block.innerHTML = '<p class="error-message">No JSON URL found in block content</p>';
    return;
  }

  // Extract the URL
  const urlMatch = textContent.match(/(https?:\/\/[^\s]+\.json)/);
  if (!urlMatch) {
    block.innerHTML = '<p class="error-message">Invalid JSON URL format</p>';
    return;
  }

  const jsonURL = urlMatch[1];
  console.log('Extracted JSON URL:', jsonURL);

  // Clear block and show loading
  block.innerHTML = '<div class="loading">Loading data...</div>';

  try {
    const data = await fetchDataWithFallbacks(jsonURL);

    if (!data || data.length === 0) {
      block.innerHTML = '<div class="error-message">No data found</div>';
      return;
    }

    // Create table
    const table = createTable(data);
    block.innerHTML = '';
    block.appendChild(table);

    console.log('Table created successfully with', data.length, 'rows');

  } catch (error) {
    console.error('Final error:', error);
    block.innerHTML = `
      <div class="error-message">
        <strong>Unable to load data</strong><br>
        Error: ${error.message}<br>
        <small>URL: ${jsonURL}</small><br>
        <small>Check if the spreadsheet is published and accessible</small>
      </div>
    `;
  }
}

async function fetchDataWithFallbacks(originalURL) {
  const attempts = [
    // Try 1: Relative path (most likely to work in EDS)
    () => {
      const url = new URL(originalURL);
      return fetch(url.pathname);
    },

    // Try 2: Original full URL
    () => fetch(originalURL),

    // Try 3: With CORS mode
    () => fetch(originalURL, { mode: 'cors' }),

    // Try 4: With no-cors mode (limited response)
    () => fetch(originalURL, { mode: 'no-cors' }),

    // Try 5: Remove protocol, let browser handle
    () => {
      const urlWithoutProtocol = originalURL.replace(/^https?:/, '');
      return fetch(urlWithoutProtocol);
    }
  ];

  for (let i = 0; i < attempts.length; i++) {
    try {
      console.log(`Attempt ${i + 1}: Trying different fetch approach`);
      const response = await attempts[i]();

      if (response.ok) {
        const json = await response.json();
        console.log(`Attempt ${i + 1} successful:`, json);

        // Handle different JSON structures
        if (json.data && Array.isArray(json.data)) {
          return json.data;
        } else if (Array.isArray(json)) {
          return json;
        } else if (json.values && Array.isArray(json.values)) {
          return json.values;
        } else {
          console.warn('Unexpected JSON structure:', json);
          continue; // Try next approach
        }
      } else {
        console.log(`Attempt ${i + 1} failed: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
    }
  }

  throw new Error('All fetch attempts failed. Check if the URL is accessible and CORS is properly configured.');
}

function createTable(data) {
  const container = document.createElement('div');
  container.classList.add('table-container');

  // Get column names from first row
  const firstRow = data[0];
  const columns = Object.keys(firstRow);

  console.log('Detected columns:', columns);

  const table = document.createElement('table');
  table.classList.add('data-table');

  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // Serial number column
  const snHeader = document.createElement('th');
  snHeader.textContent = 'S.No';
  snHeader.classList.add('serial-header');
  headerRow.appendChild(snHeader);

  // Data columns
  columns.forEach(column => {
    const th = document.createElement('th');
    th.textContent = formatColumnName(column);
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create body
  const tbody = document.createElement('tbody');

  data.forEach((row, index) => {
    const tr = document.createElement('tr');

    // Serial number
    const snCell = document.createElement('td');
    snCell.textContent = index + 1;
    snCell.classList.add('serial-cell');
    tr.appendChild(snCell);

    // Data cells
    columns.forEach(column => {
      const td = document.createElement('td');
      const value = row[column];
      td.textContent = value !== null && value !== undefined ? String(value) : '-';
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);

  // Add summary
  const summary = document.createElement('div');
  summary.classList.add('table-summary');
  summary.textContent = `Showing ${data.length} records`;

  container.appendChild(summary);
  container.appendChild(table);

  return container;
}

function formatColumnName(columnName) {
  return columnName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}
