"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Play, Square, Send } from "lucide-react"

interface Message {
    id: string
    type: "user" | "assistant" | "system"
    content: string
    timestamp: Date
}

export default function ChatWindow() {
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputText, setInputText] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const generateSessionId = () => {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    const formatMessage = (content: string) => {
        // Replace <b> tags with bold formatting
        return content
            .replace(/<b>/g, "<strong>")
            .replace(/<\/b>/g, "</strong>")
            .replace(/<i>/g, "<em>")
            .replace(/<\/i>/g, "</em>")
    }

    const addMessage = (type: "user" | "assistant" | "system", content: string) => {
        const newMessage: Message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            content,
            timestamp: new Date(),
        }
        setMessages((prev) => [...prev, newMessage])
    }

    const createSession = () => {
        const newSessionId = generateSessionId()
        setSessionId(newSessionId)
        addMessage("system", `Session created: ${newSessionId}`)
    }

    const endSession = async () => {
        if (!sessionId) return

        setIsLoading(true)
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    input_text: "End Session",
                    session_id: sessionId,
                    end_session: true,
                    session_attributes: {
                        be_limit: 5,
                    },
                }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            // Handle the specific end session response format
            const endMessage = data.response || "Session ended"
            addMessage("system", endMessage)
            setSessionId(null)
            setInputText("")
        } catch (error) {
            console.error("End session error:", error)
            addMessage("system", "⚠️ Error ending session - forcing local session termination")
            setSessionId(null)
            setInputText("")
        } finally {
            setIsLoading(false)
        }
    }

    const sendMessage = async () => {
        if (!inputText.trim() || !sessionId || isLoading) return

        const userMessage = inputText.trim()
        addMessage("user", userMessage)
        setInputText("")
        setIsLoading(true)

        // Auto-scroll to bottom after adding user message
        setTimeout(() => {
            const scrollArea = document.querySelector("[data-radix-scroll-area-viewport]")
            if (scrollArea) {
                scrollArea.scrollTop = scrollArea.scrollHeight
            }
        }, 100)

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    input_text: userMessage,
                    session_id: sessionId,
                    end_session: false,
                    session_attributes: {
                        be_limit: 5,
                    },
                }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.error) {
                addMessage("system", `⚠️ ${data.response}`)
            } else {
                addMessage("assistant", data.response || "No response received")
            }

            // Auto-scroll to bottom after adding assistant response
            setTimeout(() => {
                const scrollArea = document.querySelector("[data-radix-scroll-area-viewport]")
                if (scrollArea) {
                    scrollArea.scrollTop = scrollArea.scrollHeight
                }
            }, 100)
        } catch (error) {
            console.error("Send message error:", error)
            addMessage(
                "system",
                `❌ Connection Error: Unable to send message. Please check your internet connection and try again.`,
            )
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const clearChat = () => {
        setMessages([])
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-2xl h-[600px] flex flex-col">
                <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Chat Session Manager
                    </CardTitle>
                    <div className="flex gap-2 mt-4">
                        <Button
                            onClick={createSession}
                            disabled={!!sessionId || isLoading}
                            variant="default"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <Play className="h-4 w-4" />
                            Create Session
                        </Button>
                        <Button
                            onClick={endSession}
                            disabled={!sessionId || isLoading}
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <Square className="h-4 w-4" />
                            End Session
                        </Button>
                        <Button onClick={clearChat} variant="outline" size="sm" disabled={messages.length === 0}>
                            Clear Chat
                        </Button>
                    </div>
                    {sessionId && <div className="text-sm text-muted-foreground mt-2">Active Session: {sessionId}</div>}
                </CardHeader>

                <Separator />

                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full p-4">
                        <div className="min-h-full">
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <div className="text-center">
                                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No messages yet. Create a session to start chatting.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 pb-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[80%] p-3 rounded-lg ${
                                                    message.type === "user"
                                                        ? "bg-blue-500 text-white"
                                                        : message.type === "system"
                                                            ? "bg-gray-100 text-gray-700 text-sm"
                                                            : "bg-gray-200 text-gray-900"
                                                }`}
                                            >
                                                <div
                                                    className="whitespace-pre-wrap break-words"
                                                    dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                                                />
                                                <div
                                                    className={`text-xs mt-1 opacity-70 ${
                                                        message.type === "user" ? "text-blue-100" : "text-gray-500"
                                                    }`}
                                                >
                                                    {message.timestamp.toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-200 text-gray-900 p-3 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                                                    Typing...
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>

                <Separator />

                <CardFooter className="flex-shrink-0 p-4">
                    <div className="flex w-full gap-2">
                        <Input
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={sessionId ? "Type your message..." : "Create a session first to start chatting"}
                            disabled={!sessionId || isLoading}
                            className="flex-1"
                        />
                        <Button onClick={sendMessage} disabled={!sessionId || !inputText.trim() || isLoading} size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
