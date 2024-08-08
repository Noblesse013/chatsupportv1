'use client';
import { useState, useEffect, useRef } from 'react';
import { Box, Button, Stack, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Rating } from '@mui/material';
import Header from './components/Header'; // Adjust import path as needed
import { useRouter } from 'next/navigation';
import { firestore } from './firebase/config'; // Adjust path if necessary
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Headstarter support assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = () => {
      const user = sessionStorage.getItem('user');
      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user);
      }
    };

    checkLoginStatus();
  }, []);
  
  const handleLogout = () => {
    sessionStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserEmail('');
    router.push('/sign-in');
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);
    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ]);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFeedbackOpen = () => {
    setOpenFeedbackDialog(true);
  };

  const handleFeedbackClose = () => {
    setOpenFeedbackDialog(false);
  };

  const handleFeedbackSubmit = async () => {
    if (feedbackRating > 0) {
      try {
        const userId = userEmail; // Use email as user ID
        if (userId) {
          const feedbackCollectionRef = collection(firestore, 'users', userId, 'feedback');
          await addDoc(feedbackCollectionRef, {
            rating: feedbackRating,
            timestamp: Timestamp.fromDate(new Date()),
          });
          console.log('Feedback submitted successfully');
        } else {
          console.error('User ID is missing');
        }
      } catch (error) {
        console.error('Error submitting feedback:', error);
      }
    } else {
      console.error('Invalid feedback rating');
    }
    setOpenFeedbackDialog(false);
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      bgcolor="white"
    >
      <Header isLoggedIn={isLoggedIn} userEmail={userEmail} onLogout={handleLogout} />
      {isLoggedIn && (
        <Stack
          direction="column"
          width="100%"
          height="calc(100% - 64px)"
          maxWidth="600px"
          margin="0 auto"
          spacing={2}
          padding={2}
          overflow="hidden"
        >
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            height="100%"
            bgcolor="white"
            borderRadius={4}
            padding={2}
            boxShadow={1}
            border={1}
            borderColor="grey.500"
          >
            <Stack
              direction="column"
              spacing={2}
              flexGrow={1}
              overflow="auto"
            >
              {messages.map((message, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent={
                    message.role === 'assistant' ? 'flex-start' : 'flex-end'
                  }
                >
                  <Box
                    bgcolor={
                      message.role === 'assistant'
                        ? 'primary.main'
                        : '#6D6E70' // Change this to 'lightblue'
                    }
                    color="white"
                    borderRadius={16}
                    padding={2}
                  >
                    {message.content}
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center" marginTop={2}>
              <TextField
                label="Message"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <Button 
                variant="contained" 
                onClick={sendMessage}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            </Stack>
            <Button 
              variant="outlined" 
              onClick={handleFeedbackOpen} 
              sx={{ marginTop: 2 }}
            >
              Provide Feedback
            </Button>
          </Box>
        </Stack>
      )}
      
      {/* Feedback Dialog */}
      <Dialog open={openFeedbackDialog} onClose={handleFeedbackClose}>
        <DialogTitle>Provide Feedback</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Rating
              name="feedback-rating"
              value={feedbackRating}
              onChange={(event, newValue) => setFeedbackRating(newValue)}
              size="large"
            />
            <TextField
              label="Additional Comments"
              multiline
              rows={4}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFeedbackClose}>Cancel</Button>
          <Button onClick={handleFeedbackSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}