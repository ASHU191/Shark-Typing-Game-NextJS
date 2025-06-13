"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Fish, Zap, Clock, Target, Trophy, BookOpen, Play, X } from "lucide-react"

type GameState = "start" | "rules" | "playing" | "won" | "lost"

interface GameStats {
  wpm: number
  accuracy: number
  timeElapsed: number
  charactersTyped: number
  errors: number
}

const SAMPLE_TEXTS = [
  "The quick brown fox jumps over the lazy dog near the sparkling blue ocean waves.",
  "Swimming through coral reefs, colorful fish dance in the warm tropical waters below.",
  "Deep sea adventures await those brave enough to explore the mysterious ocean depths.",
  "Sharks patrol the waters while schools of fish move in perfect synchronized harmony.",
  "Ocean currents carry ancient secrets from distant shores to unexplored territories.",
]

export default function SharkTypingGame() {
  const [gameState, setGameState] = useState<GameState>("start")
  const [currentText, setCurrentText] = useState("")
  const [userInput, setUserInput] = useState("")
  const [gameStats, setGameStats] = useState<GameStats>({
    wpm: 0,
    accuracy: 100,
    timeElapsed: 0,
    charactersTyped: 0,
    errors: 0,
  })

  // Game positions (in pixels from left)
  const [fishPosition, setFishPosition] = useState(100)
  const [sharkPosition, setSharkPosition] = useState(50)
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [lastProgressCheck, setLastProgressCheck] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Calculate expected typing position based on time
  const getExpectedPosition = useCallback(() => {
    if (!gameStartTime) return 0
    const timeElapsed = (Date.now() - gameStartTime) / 1000
    const expectedCharsPerSecond = 3 // Adjust difficulty here
    return Math.floor(timeElapsed * expectedCharsPerSecond)
  }, [gameStartTime])

  // Update game stats
  const updateStats = useCallback(() => {
    if (!gameStartTime) return

    const timeElapsed = (Date.now() - gameStartTime) / 1000
    const charactersTyped = userInput.length
    const errors = userInput.split("").filter((char, index) => char !== currentText[index]).length

    const wordsTyped = charactersTyped / 5 // Standard: 5 characters = 1 word
    const wpm = timeElapsed > 0 ? Math.round((wordsTyped / timeElapsed) * 60) : 0
    const accuracy = charactersTyped > 0 ? Math.round(((charactersTyped - errors) / charactersTyped) * 100) : 100

    setGameStats({
      wpm,
      accuracy,
      timeElapsed: Math.round(timeElapsed),
      charactersTyped,
      errors,
    })
  }, [userInput, currentText, gameStartTime])

  // Game timer - runs every second
  useEffect(() => {
    if (gameState === "playing" && gameStartTime) {
      timerRef.current = setInterval(() => {
        updateStats()

        const expectedPos = getExpectedPosition()
        const actualPos = userInput.length
        const lag = expectedPos - actualPos

        // If player is behind by 3+ characters, shark moves closer
        if (lag >= 3) {
          setSharkPosition((prev) => Math.min(prev + 7, fishPosition - 20))
        }

        // Update fish position based on typing progress
        const progress = currentText.length > 0 ? actualPos / currentText.length : 0
        const newFishPos = 100 + progress * 600 // Fish moves across screen
        setFishPosition(newFishPos)

        // Check win/lose conditions
        if (sharkPosition >= fishPosition - 30) {
          setGameState("lost")
        } else if (actualPos >= currentText.length && userInput === currentText) {
          setGameState("won")
        }
      }, 1000)

      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [gameState, gameStartTime, userInput, currentText, fishPosition, sharkPosition, updateStats, getExpectedPosition])

  const startGame = () => {
    const randomText = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)]
    setCurrentText(randomText)
    setUserInput("")
    setFishPosition(100)
    setSharkPosition(50)
    setGameStartTime(Date.now())
    setLastProgressCheck(0)
    setGameStats({
      wpm: 0,
      accuracy: 100,
      timeElapsed: 0,
      charactersTyped: 0,
      errors: 0,
    })
    setGameState("playing")

    // Focus input after state update
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= currentText.length) {
      setUserInput(value)

      // Check for completion
      if (value === currentText) {
        setGameState("won")
      }
    }
  }

  const resetGame = () => {
    setGameState("start")
    if (timerRef.current) clearInterval(timerRef.current)
  }

  // Render different screens based on game state
  const renderStartScreen = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-800 flex items-center justify-center gap-2">
            <Fish className="h-8 w-8" />
            Shark Typing Game
          </CardTitle>
          <p className="text-blue-600">Help the fish escape from the shark by typing fast!</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={startGame} className="w-full" size="lg">
            <Play className="mr-2 h-4 w-4" />
            Play Game
          </Button>
          <Button onClick={() => setGameState("rules")} variant="outline" className="w-full" size="lg">
            <BookOpen className="mr-2 h-4 w-4" />
            Rules
          </Button>
          <Button onClick={() => window.close()} variant="outline" className="w-full" size="lg">
            <X className="mr-2 h-4 w-4" />
            Exit
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderRulesScreen = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-800">How to Play</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Type the text as quickly and accurately as possible to help the fish escape!</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>The fish moves forward based on your typing progress.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>If you fall behind by 3+ characters, the shark moves 7 pixels closer!</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Complete the text correctly to win and save the fish.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>If the shark catches the fish, you lose!</p>
            </div>
          </div>
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-blue-800 mb-2">Scoring:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Words Per Minute (WPM)</li>
              <li>• Typing Accuracy Percentage</li>
              <li>• Time to Complete</li>
            </ul>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={startGame} className="flex-1">
              Start Playing
            </Button>
            <Button onClick={() => setGameState("start")} variant="outline" className="flex-1">
              Back to Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderGameScreen = () => {
    const progress = currentText.length > 0 ? (userInput.length / currentText.length) * 100 : 0
    const isCorrect = userInput === currentText.substring(0, userInput.length)

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-300 via-blue-400 to-blue-600 p-4">
        {/* Ocean Scene */}
        <div className="relative h-48 bg-gradient-to-b from-blue-400 to-blue-700 rounded-lg mb-4 overflow-hidden">
          {/* Waves */}
          <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-blue-800 to-transparent opacity-50"></div>

          {/* Fish */}
          <div
            className="absolute top-16 transition-all duration-1000 ease-out"
            style={{ left: `${Math.min(fishPosition, window.innerWidth - 100)}px` }}
          >
            <Fish className="h-12 w-12 text-orange-400 transform rotate-0" />
          </div>

          {/* Shark */}
          <div className="absolute top-20 transition-all duration-1000 ease-out" style={{ left: `${sharkPosition}px` }}>
            <div className="text-4xl">🦈</div>
          </div>

          {/* Bubbles */}
          <div className="absolute top-8 left-1/4 w-2 h-2 bg-white rounded-full opacity-60 animate-bounce"></div>
          <div className="absolute top-12 left-1/2 w-1 h-1 bg-white rounded-full opacity-40 animate-bounce delay-300"></div>
          <div className="absolute top-6 right-1/3 w-3 h-3 bg-white rounded-full opacity-50 animate-bounce delay-700"></div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Card className="bg-white/90">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-medium">WPM</span>
              </div>
              <div className="text-lg font-bold">{gameStats.wpm}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/90">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">Accuracy</span>
              </div>
              <div className="text-lg font-bold">{gameStats.accuracy}%</div>
            </CardContent>
          </Card>

          <Card className="bg-white/90">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Time</span>
              </div>
              <div className="text-lg font-bold">{gameStats.timeElapsed}s</div>
            </CardContent>
          </Card>

          <Card className="bg-white/90">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                <Trophy className="h-4 w-4" />
                <span className="text-xs font-medium">Progress</span>
              </div>
              <div className="text-lg font-bold">{Math.round(progress)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <Progress value={progress} className="h-3" />
        </div>

        {/* Text Display */}
        <Card className="mb-4 bg-white/95">
          <CardContent className="p-4">
            <div className="text-lg font-mono leading-relaxed">
              {currentText.split("").map((char, index) => {
                let className = "transition-colors duration-150 "
                if (index < userInput.length) {
                  className += userInput[index] === char ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                } else if (index === userInput.length) {
                  className += "bg-blue-200 animate-pulse"
                } else {
                  className += "text-gray-600"
                }
                return (
                  <span key={index} className={className}>
                    {char}
                  </span>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Input Field */}
        <Card className="mb-4 bg-white/95">
          <CardContent className="p-4">
            <Input
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              placeholder="Start typing here..."
              className={`text-lg font-mono ${isCorrect ? "border-green-500" : "border-red-500"}`}
              autoFocus
            />
          </CardContent>
        </Card>

        {/* Status Message */}
        <div className="text-center">
          <p className="text-white font-medium">
            {userInput.length === 0 && "Start typing to help the fish escape!"}
            {userInput.length > 0 && isCorrect && userInput.length < currentText.length && "Great! Keep going!"}
            {userInput.length > 0 && !isCorrect && "Check your typing - the shark is getting closer!"}
          </p>
        </div>

        {/* Exit Button */}
        <div className="fixed top-4 right-4">
          <Button onClick={resetGame} variant="outline" size="sm">
            Exit Game
          </Button>
        </div>
      </div>
    )
  }

  const renderEndScreen = (won: boolean) => (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className={`text-3xl font-bold ${won ? "text-green-600" : "text-red-600"}`}>
            {won ? "🐟 Fish Escaped! 🎉" : "🦈 Shark Attack! 💥"}
          </CardTitle>
          <p className={won ? "text-green-600" : "text-red-600"}>
            {won ? "Congratulations! You saved the fish!" : "The shark caught the fish. Try again!"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{gameStats.wpm}</div>
              <div className="text-sm text-gray-600">WPM</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{gameStats.accuracy}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{gameStats.timeElapsed}s</div>
              <div className="text-sm text-gray-600">Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{gameStats.charactersTyped}</div>
              <div className="text-sm text-gray-600">Characters</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={startGame} className="flex-1">
              Play Again
            </Button>
            <Button onClick={resetGame} variant="outline" className="flex-1">
              Main Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render appropriate screen based on game state
  switch (gameState) {
    case "start":
      return renderStartScreen()
    case "rules":
      return renderRulesScreen()
    case "playing":
      return renderGameScreen()
    case "won":
      return renderEndScreen(true)
    case "lost":
      return renderEndScreen(false)
    default:
      return renderStartScreen()
  }
}
