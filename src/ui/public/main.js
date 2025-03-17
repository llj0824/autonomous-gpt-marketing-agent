// Main dashboard logic

// Refresh data every 5 seconds
const REFRESH_INTERVAL = 5000;
let intervalId;

// Modal for viewing data
let previewModal = null;
let previewModalTitle = null;
let previewModalBody = null;

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

// Show preview of stage data
async function showStagePreview(stage) {
  let apiEndpoint;
  let title;
  
  switch(stage) {
    case 'tweets':
      apiEndpoint = '/api/stage/tweets';
      title = 'Tweets Collected';
      break;
    case 'decisions':
      apiEndpoint = '/api/stage/decisions';
      title = 'Decision Engine Results';
      break;
    case 'tools':
      apiEndpoint = '/api/stage/tools';
      title = 'Tool Application Results';
      break;
    case 'responses':
      apiEndpoint = '/api/stage/generated-responses';
      title = 'Generated Responses';
      break;
    default:
      console.error('Unknown stage:', stage);
      return;
  }
  
  try {
    const response = await fetch(apiEndpoint);
    const data = await response.json();
    
    // Format the data for display
    let content = '';
    
    if (data.length === 0) {
      content = '<div class="alert alert-info">No data available for this stage yet.</div>';
    } else {
      // Format based on stage type
      if (stage === 'tweets') {
        content = '<div class="list-group">';
        data.forEach((tweet, index) => {
          content += `
            <div class="list-group-item">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">@${tweet.author.username}</h5>
                <small>${new Date(tweet.timestamp).toLocaleString()}</small>
              </div>
              <p class="mb-1">${tweet.content}</p>
              <small>Engagement: ${tweet.engagement} | URL: ${tweet.url || 'N/A'}</small>
            </div>
          `;
        });
        content += '</div>';
      } else if (stage === 'decisions') {
        content = '<div class="list-group">';
        data.forEach((decision, index) => {
          const relevanceClass = decision.relevanceScore > 70 ? 'text-success' : 
                               decision.relevanceScore > 40 ? 'text-warning' : 'text-danger';
          content += `
            <div class="list-group-item">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">@${decision.tweet.author.username}</h5>
                <span class="badge ${decision.selectedTool ? 'bg-success' : 'bg-danger'}">
                  ${decision.selectedTool ? 'Matched' : 'Rejected'}
                </span>
              </div>
              <p class="mb-1">${decision.tweet.content}</p>
              <div>
                <strong class="${relevanceClass}">Relevance: ${decision.relevanceScore}/100</strong>
                ${decision.selectedTool ? 
                  `<div>Selected Tool: <strong>${decision.selectedTool.name}</strong></div>
                   <div>Reasoning: ${decision.reasoning}</div>` : 
                  '<div>Reasoning: Not relevant enough</div>'}
              </div>
            </div>
          `;
        });
        content += '</div>';
      } else if (stage === 'tools') {
        content = '<div class="list-group">';
        data.forEach((toolResult, index) => {
          content += `
            <div class="list-group-item">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">Tool: ${toolResult.tool.name}</h5>
                <small>Tweet by @${toolResult.tweet.author.username}</small>
              </div>
              <div class="card mb-2">
                <div class="card-header">Original Tweet</div>
                <div class="card-body">
                  <p>${toolResult.tweet.content}</p>
                </div>
              </div>
              <div class="card">
                <div class="card-header">Tool Output</div>
                <div class="card-body">
                  <p>${toolResult.toolOutput.content}</p>
                  <div class="mt-2">
                    <strong>Reasoning:</strong>
                    <p>${toolResult.toolOutput.reasoning}</p>
                  </div>
                </div>
              </div>
            </div>
          `;
        });
        content += '</div>';
      } else if (stage === 'responses') {
        content = '<div class="list-group">';
        data.forEach((response, index) => {
          content += `
            <div class="list-group-item">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">Response to @${response.tweet.author.username}</h5>
                <span class="badge bg-info">${response.tool.name}</span>
              </div>
              <div class="card mb-2">
                <div class="card-header">Original Tweet</div>
                <div class="card-body">
                  <p>${response.tweet.content}</p>
                </div>
              </div>
              <div class="card mb-2">
                <div class="card-header">Tool Output</div>
                <div class="card-body">
                  <p>${response.toolOutput.content}</p>
                </div>
              </div>
              <div class="card">
                <div class="card-header">Response</div>
                <div class="card-body">
                  <p>${response.responseText}</p>
                </div>
              </div>
            </div>
          `;
        });
        content += '</div>';
      }
    }
    
    // Update modal content
    previewModalTitle.textContent = title;
    previewModalBody.innerHTML = content;
    
    // Show the modal
    new bootstrap.Modal(previewModal).show();
    
  } catch (error) {
    console.error(`Error fetching ${stage} data:`, error);
  }
}

// Initialize the dashboard
async function initDashboard() {
  // Create the modal for previews
  createPreviewModal();
  
  // Set up stage preview clicks
  document.getElementById('tweets-total').parentElement.addEventListener('click', () => showStagePreview('tweets'));
  document.getElementById('decisions-total').parentElement.addEventListener('click', () => showStagePreview('decisions'));
  document.getElementById('tools-total').parentElement.addEventListener('click', () => showStagePreview('tools'));
  document.getElementById('responses-total').parentElement.addEventListener('click', () => showStagePreview('responses'));
  
  // Add cursor style to make it obvious these are clickable
  const statusItems = document.querySelectorAll('.status-item');
  statusItems.forEach(item => {
    item.style.cursor = 'pointer';
    item.title = 'Click to view details';
  });
  
  // Initial data load
  await updateDashboard();
  
  // Set up auto-refresh
  intervalId = setInterval(updateDashboard, REFRESH_INTERVAL);
  
  // Set up manual refresh button
  document.getElementById('refresh-btn').addEventListener('click', updateDashboard);
}

// Create preview modal
function createPreviewModal() {
  // Create modal element
  const modalHtml = `
    <div class="modal fade" id="previewModal" tabindex="-1" aria-labelledby="previewModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="previewModalLabel">Stage Preview</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="previewModalBody">
            <!-- Modal content will be inserted here -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to the document
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Store references to modal elements
  previewModal = document.getElementById('previewModal');
  previewModalTitle = document.getElementById('previewModalLabel');
  previewModalBody = document.getElementById('previewModalBody');
}

// Start the dashboard when the page loads
document.addEventListener('DOMContentLoaded', initDashboard);

// Clean up interval when page is unloaded
window.addEventListener('beforeunload', () => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});