# Chrome Extension Integration Plan

## Current States

### React Application
- Full-featured dashboard UI with social features
- Uses modern Firebase JS SDK
- Built with React, React hooks, and TypeScript
- Uses Firebase authentication and Firestore

### Chrome Extension
- Uses older Firebase JS SDK (compat version)
- Contains background script, popup, and content scripts
- Uses Chrome extension APIs (chrome.storage, chrome.identity, etc.)
- Uses Chrome extension manifest v3

## Integration Strategy

### Phase 1: Common Firebase Configuration
1. Create a shared Firebase config module that works across both environments
2. Update to use the same Firebase secrets and project

### Phase 2: Extension Components
1. Create a build process that compiles React components for extension use
2. Replace popup.html with our React UI (simplified version)
3. Create extension-specific React hooks for Chrome API interactions

### Phase 3: Background Script Integration
1. Update the background.js script to use our Firebase module
2. Ensure backward compatibility with existing data structure
3. Create bridge between background script and React components

### Phase 4: Data Synchronization
1. Ensure both extension and web app use the same data format
2. Create adaptors for converting data between formats if needed
3. Implement cross-platform sync operations

## Implementation Plan

### Step 1: Create Combined Firebase Module
- Create a configurable Firebase module that works in both environments
- Update environment variable handling

### Step 2: Extension-Ready React Build
- Configure Vite/Webpack for Chrome extension build 
- Create "extension mode" for React components

### Step 3: Extension Popup Replacement
- Build React popup component with simplified dashboard
- Implement chrome.* API hooks for React

### Step 4: Background Script Update
- Modernize background script while maintaining APIs
- Connect to React components with messaging bridge

### Step 5: Content Script Integration
- Create React content script components
- Integrate with main React codebase

## Technical Challenges

1. **Environment Differences**: Chrome extensions run in a different context than web apps
2. **API Access**: Chrome extensions use chrome.* APIs that aren't available in web context
3. **Build Process**: Need to configure build for both environments
4. **Authentication**: Need to support both Chrome identity API and Firebase web auth
5. **Storage**: Need to bridge between chrome.storage and Firebase

## Testing Strategy

1. Test web application functionality independently
2. Test Chrome extension functionality independently
3. Test data synchronization between platforms
4. Test authentication flow in both environments