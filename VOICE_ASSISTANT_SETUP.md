# Voice Assistant Setup Guide

## Overview

FlowState AI now includes conversational AI integration with voice interaction! You can speak to the website and it will respond using AI-generated speech.

## Features

- **Speech Recognition**: Uses Web Speech API to capture your voice
- **Conversational AI**: Powered by OpenAI GPT (configurable model)
- **Text-to-Speech**: Uses ElevenLabs for high-quality voice responses (falls back to browser TTS if unavailable)
- **Conversation History**: Maintains context across multiple interactions

## Setup Instructions

### 1. Get API Keys

#### OpenAI API Key (Required for AI responses)
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy the key

#### ElevenLabs API Key (Optional, for better voice quality)
1. Go to https://elevenlabs.io/
2. Sign up or log in
3. Go to your profile → API Keys
4. Copy your API key
5. Note: If not provided, the system will use browser's built-in TTS

### 2. Configure Environment Variables

Edit the `.env` file in the project root:

```bash
# Existing Hume API key
PUBLIC_HUME_API_KEY=fGpMexMs51OMRRrXvgDsbeDBAtVODHVxyEtKNUtC9SAnAh04

# Add your AI API keys
PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

**Note**: For Parcel v2, environment variables must be prefixed with `PUBLIC_` to be accessible in the browser.

### 3. Alternative: Set via Browser Console

If you prefer not to use environment variables, you can set them in the browser console:

```javascript
window.OPENAI_API_KEY = 'your_openai_api_key_here';
window.ELEVENLABS_API_KEY = 'your_elevenlabs_api_key_here';
// Then refresh the page
```

## Usage

### Starting Voice Assistant

1. Open the FlowState AI website
2. Click the **"🎙️ Voice Assistant: OFF"** button in the control panel (top-right)
3. Grant microphone permissions when prompted
4. The button will change to **"🎙️ Voice Assistant: ON"**

### Using Voice Assistant

1. **Speak**: Once activated, the assistant listens for your voice
2. **Wait**: After you finish speaking, it processes your input
3. **Listen**: The AI responds with voice output
4. **Continue**: The conversation continues - speak again to ask follow-up questions

### Stopping Voice Assistant

- Click the **"🎙️ Voice Assistant: ON"** button again to stop listening

## How It Works

1. **Speech Recognition**: Your voice is captured using the Web Speech API
2. **AI Processing**: Your speech is sent to OpenAI's API for processing
3. **Response Generation**: The AI generates a contextual response
4. **Text-to-Speech**: The response is converted to speech using ElevenLabs (or browser TTS)
5. **Audio Playback**: You hear the AI's response

## Browser Compatibility

### Speech Recognition
- ✅ Chrome/Edge (Chromium-based browsers)
- ✅ Safari (macOS/iOS)
- ⚠️ Firefox (limited support)

### Text-to-Speech
- ✅ All modern browsers (ElevenLabs or browser TTS)

## Troubleshooting

### "Voice assistant not available"
- **Cause**: API keys not configured
- **Solution**: Add API keys to `.env` file or set via browser console

### "Speech recognition not supported"
- **Cause**: Using unsupported browser
- **Solution**: Use Chrome, Edge, or Safari

### Microphone not working
- **Cause**: Permissions denied or microphone not available
- **Solution**: Check browser permissions and ensure microphone is connected

### No audio response
- **Cause**: ElevenLabs API key invalid or network issue
- **Solution**: System will fall back to browser TTS automatically

## Configuration Options

You can customize the voice assistant in `src/js/voice/VoiceAssistant.js`:

- **Model**: Change OpenAI model (default: `gpt-3.5-turbo`)
- **Voice ID**: Change ElevenLabs voice (default: `21m00Tcm4TlvDq8ikWAM`)
- **Max Tokens**: Adjust response length (default: 150)
- **Temperature**: Adjust creativity (default: 0.7)

## Security Notes

- API keys are exposed to the browser (required for client-side usage)
- Consider using a backend proxy for production to keep keys secure
- Monitor API usage to avoid unexpected costs
- OpenAI and ElevenLabs have usage limits and costs

## Cost Considerations

- **OpenAI**: Pay-per-use based on tokens (GPT-3.5-turbo is relatively inexpensive)
- **ElevenLabs**: Free tier available, then pay-per-character
- **Recommendation**: Monitor usage and set up billing alerts

## Example Conversation

**You**: "What is FlowState?"

**AI**: "FlowState is an immersive audio-visual experience that combines 3D visualizations with real-time audio analysis and facial expression detection to create dynamic, responsive art."

**You**: "How does it work?"

**AI**: "FlowState uses your microphone to analyze audio frequencies, which drive 3D particle effects and mesh deformations. It also uses your camera to detect facial expressions, adjusting colors and visual effects based on your emotions."

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify API keys are correctly configured
3. Ensure microphone permissions are granted
4. Test with browser TTS first (no ElevenLabs key needed)

