// Main dashboard logic

// Refresh data every 5 seconds
const REFRESH_INTERVAL = 5000;
let intervalId;

// Update the dashboard with the latest data
async function updateDashboard() {
  try {
    // Fetch status data
    const statusResponse = await fetch('/api/status');
    const status = await statusResponse.json();
    
    // Update status metrics
    document.getElementById('tweets-total').textContent = status.tweets.total;
    document.getElementById('tweets-details').textContent = 
      `${status.tweets.processed} processed / ${status.tweets.pending} pending`;
    
    document.getElementById('decisions-total').textContent = status.decisions.total;
    document.getElementById('decisions-details').textContent = 
      `${status.decisions.matched} matched / ${status.decisions.rejected} rejected`;
    
    document.getElementById('tools-total').textContent = status.tools.total;
    document.getElementById('tools-details').textContent = 
      `${status.tools.processed} processed / ${status.tools.inProgress} in progress`;
    
    document.getElementById('responses-total').textContent = status.responses.total;
    document.getElementById('responses-details').textContent = 
      `${status.responses.generated} generated / ${status.responses.pending} pending`;
    
    // Update error log
    const errorContainer = document.getElementById('error-container');
    const errorList = document.getElementById('error-list');
    
    if (status.errors && status.errors.length > 0) {
      errorContainer.style.display = 'block';
      errorList.innerHTML = '';
      
      status.errors.forEach(error => {
        const li = document.createElement('li');
        li.className = 'list-group-item list-group-item-danger';
        li.textContent = `${error.timestamp}: ${error.message} ${error.tweet ? `(Tweet from @${error.tweet})` : ''}`;
        errorList.appendChild(li);
      });
    } else {
      errorContainer.style.display = 'none';
    }
    
    // Fetch response data
    const responsesResponse = await fetch('/api/responses');
    const responses = await responsesResponse.json();
    
    // Update responses table
    const tableBody = document.getElementById('responses-table-body');
    const noResponses = document.getElementById('no-responses');
    
    if (responses && responses.length > 0) {
      tableBody.innerHTML = '';
      noResponses.style.display = 'none';
      
      responses.forEach(response => {
        const row = document.createElement('tr');
        
        // Author
        const authorCell = document.createElement('td');
        authorCell.textContent = response.author;
        row.appendChild(authorCell);
        
        // Tweet
        const tweetCell = document.createElement('td');
        tweetCell.textContent = response.content.length > 100 ? 
          response.content.substring(0, 100) + '...' : response.content;
        tweetCell.title = response.content;
        row.appendChild(tweetCell);
        
        // Tool Used
        const toolCell = document.createElement('td');
        toolCell.textContent = response.selectedTool;
        row.appendChild(toolCell);
        
        // Response
        const responseCell = document.createElement('td');
        responseCell.textContent = response.response.length > 100 ? 
          response.response.substring(0, 100) + '...' : response.response;
        responseCell.title = response.response;
        row.appendChild(responseCell);
        
        // Status
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = 'badge ' + 
          (response.status === 'approved' ? 'badge-success' : 
           response.status === 'rejected' ? 'badge-danger' : 'badge-warning');
        statusBadge.textContent = response.status;
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);
        
        tableBody.appendChild(row);
      });
    } else {
      tableBody.innerHTML = '';
      noResponses.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Error updating dashboard:', error);
  }
}

// Initialize the dashboard
async function initDashboard() {
  // Initial data load
  await updateDashboard();
  
  // Set up auto-refresh
  intervalId = setInterval(updateDashboard, REFRESH_INTERVAL);
  
  // Set up manual refresh button
  document.getElementById('refresh-btn').addEventListener('click', updateDashboard);
}

// Start the dashboard when the page loads
document.addEventListener('DOMContentLoaded', initDashboard);

// Clean up interval when page is unloaded
window.addEventListener('beforeunload', () => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});