class Utils {
  constructor() {
    
  }
    static renderMessage(message, statusClass = '', headerOnly = false) {
      return `
        <div class="chat-message">
          <div class="message-header">
            <span class="username">${message.username}</span>
            ${statusClass ? `<span class="status ${statusClass}">${message.status}</span>` : `<span class="status status-undefined">ADMIN</span>`}
          </div>
          ${headerOnly ? '' : `
            <div class="message-text">${message.message}</div>
            <div class="message-timestamp">
              <span class="timestamp">${this.formatTimestamp(message.timestamp)}</span>
            </div>
          `}
        </div>
      `;
    }
  
    static displayMessage(message, statusClass) {
      const messageElement = this.renderMessage(message, statusClass);
      const msgList = $('#messages');
      msgList.append(messageElement);
      msgList.scrollTop(msgList[0].scrollHeight);
    }
  
    static formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleDateString(navigator.language, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  
    static getStatusClass(status) {
      return `status-${status?.toLowerCase() ? status?.toLowerCase() : 'undefined'}`;
    }
}
  
const utils = new Utils();