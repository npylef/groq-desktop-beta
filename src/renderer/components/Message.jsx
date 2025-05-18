import React, { useState } from 'react';
import ToolCall from './ToolCall';

function Message({ message, children, onToolCallExecute, allMessages, isLastMessage, onRemoveMessage, onEdit, onBranch, onRegenerate, index }) {
  const { role, tool_calls, reasoning, isStreaming } = message;
  const [showReasoning, setShowReasoning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const isUser = role === 'user';
  const hasReasoning = reasoning && !isUser;
  const isStreamingMessage = isStreaming === true;

  const startEdit = () => {
    let text = '';
    if (typeof message.content === 'string') {
      text = message.content;
    } else if (Array.isArray(message.content)) {
      text = message.content.filter(p => p.type === 'text').map(p => p.text).join('\n');
    }
    setEditText(text);
    setEditing(true);
  };

  const saveEdit = () => {
    if (onEdit) onEdit(editText);
    setEditing(false);
  };

  // Find tool results for this message's tool calls in the messages array
  const findToolResult = (toolCallId) => {
    if (!allMessages) return null;
    
    // Look for a tool message that matches this tool call ID
    const toolMessage = allMessages.find(
      msg => msg.role === 'tool' && msg.tool_call_id === toolCallId
    );
    
    return toolMessage ? toolMessage.content : null;
  };

  const messageClasses = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
  // Apply background only for user messages
  const bubbleStyle = isUser ? 'bg-user-message-bg' : ''; // No background for assistant/system
  const bubbleClasses = `relative px-4 py-3 rounded-lg max-w-xl ${bubbleStyle} group`; // Added group for remove button
  const wrapperClasses = `message-content-wrapper ${isUser ? 'text-white' : 'text-white'} break-words`; // Keep text white for both, use break-words

  const toggleReasoning = () => setShowReasoning(!showReasoning);

  return (
    <div className={messageClasses}>
      <div className={bubbleClasses}>
        {isLastMessage && onRemoveMessage && (
          <button 
            onClick={onRemoveMessage}
            className={`absolute ${isUser ? 'right-1' : 'left-1'} top-0 -translate-y-1/2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 z-10`}
            title="Remove message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {isStreamingMessage && (
          <div className="streaming-indicator mb-1">
            <span className="dot-1"></span>
            <span className="dot-2"></span>
            <span className="dot-3"></span>
          </div>
        )}
        <div className={wrapperClasses}>
          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                className="w-full p-2 border border-gray-500 rounded-md text-black"
                value={editText}
                onChange={e => setEditText(e.target.value)}
              />
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
        
        {tool_calls && tool_calls.map((toolCall, index) => (
          <ToolCall 
            key={toolCall.id || index} 
            toolCall={toolCall} 
            toolResult={findToolResult(toolCall.id)}
          />
        ))}

        {hasReasoning && (
          <div className="mt-3 border-t border-gray-600 pt-2">
            <button 
              onClick={toggleReasoning}
              className="flex items-center text-sm px-3 py-1 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors duration-200"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 mr-1 transition-transform duration-200 ${showReasoning ? 'rotate-90' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showReasoning ? 'Hide reasoning' : 'Show reasoning'}
            </button>
            
            {showReasoning && (
              <div className="mt-2 p-3 bg-gray-800 rounded-md text-sm border border-gray-600">
                <pre className="whitespace-pre-wrap break-words">{reasoning}</pre>
              </div>
            )}
          </div>
        )}
        <div className="mt-1 flex gap-2 text-xs text-gray-400">
          {onEdit && !editing && (
            <button onClick={startEdit}>Edit</button>
          )}
          {onBranch && <button onClick={onBranch}>Branch</button>}
          {onRegenerate && <button onClick={onRegenerate}>Regenerate</button>}
        </div>
      </div>
    </div>
  );
}

export default Message; 