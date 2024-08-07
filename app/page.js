'use client'
import Image from "next/image";
import { useState } from "react";
import { Box, Text, Input, Button } from "@mui/material";


export default function Home() {
  const [messages, setMessages] = useState({
    role: 'assistant',
    content: 'Elo Im an AI assistant. How can I help you today?',
  })
  
  const [message, setMessage] = useState('')

  return (
    <Box width="100%" 
    height="100%" 
    display="flex"
    flexDirection="column" 
    justifyContent="center"
    alignItems="center">
    </Box>
  )
}
