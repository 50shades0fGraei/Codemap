"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

const Canvas = dynamic(() => import("@react-three/fiber").then((mod) => ({ default: mod.Canvas })), {
  ssr: false,
})
const OrbitControls = dynamic(() => import("@react-three/drei").then((mod) => ({ default: mod.OrbitControls })), {
  ssr: false,
})
const Text = dynamic(() => import("@react-three/drei").then((mod) => ({ default: mod.Text })), {
  ssr: false,
})

interface ProcessNode {
  index: number
  coords: [number, number, number]
  strand: number
  base: string
  complement: string
  angle: number
  base_pair_id: string
  command?: string
  category?: string
  is_fork?: boolean
  fork_type?: "if" | "else" | "loop" | "function_call" | "merge"
  parent_index?: number
  fork_direction?: "left" | "right"
  spiral_id?: string
}

interface ForkSpiral {
  id: string
  nodes: ProcessNode[]
  fork_type: string
  parent_node: number
  merge_node?: number
  direction: "left" | "right"
}

interface MapData {
  address: string
  command: string
  coords: [number, number, number]
  subprocesses: string[]
  direction: string | null
  category?: string
}

function DNASpiral({
  nodes,
  forkSpirals,
  selectedNode,
  onNodeClick,
}: {
  nodes: ProcessNode[]
  forkSpirals: ForkSpiral[]
  selectedNode: ProcessNode | null
  onNodeClick: (node: ProcessNode) => void
}) {
  const groupRef = useRef<any>(null)

  useEffect(() => {
    // Function to generate spiral coordinates
    const generateSpiralCoordinates = (base: number, helixRadius: number, pitch: number) => {
      return Array.from({ length: base }, (_, i) => {
        const angle = (2 * Math.PI * i) / (base / 2)
        const height = (i * pitch) / (base / 2)
        const strand = i % 2

        // Main spiral: down-right, up-left
        const direction = height > 0 ? 1 : -1
        const spiralDirection = direction > 0 ? 1 : -1

        const x = helixRadius * Math.cos(angle + strand * Math.PI + spiralDirection * 0.1)
        const y = helixRadius * Math.sin(angle + strand * Math.PI + spiralDirection * 0.1)

        const bases = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
        const base_char = bases[i % bases.length]

        return {
          index: i,
          coords: [x, y, height] as [number, number, number],
          strand,
          base: base_char,
          complement: bases[bases.length - 1 - (i % bases.length)],
          angle,
          base_pair_id: `${base_char}-${bases[bases.length - 1 - (i % bases.length)]}`,
          spiral_id: "main",
        }
      })
    }

    // Generate main DNA spiral coordinates
    const base = 44
    const helixRadius = 12
    const pitch = 6

    const spiralNodes = generateSpiralCoordinates(base, helixRadius, pitch)
    // Declare setSpiralNodes variable before using it
    const setSpiralNodes = (nodes: ProcessNode[]) => {
      // Assuming this is a placeholder for setting state
      console.log(nodes)
    }
    setSpiralNodes(spiralNodes)
  }, [])

  const getForkColor = (forkType?: string) => {
    switch (forkType) {
      case "if":
        return "#10b981" // green
      case "else":
        return "#f59e0b" // amber
      case "loop":
        return "#8b5cf6" // violet
      case "function_call":
        return "#06b6d4" // cyan
      case "merge":
        return "#f97316" // orange
      default:
        return "#6b7280" // gray
    }
  }

  return (
    <div ref={groupRef}>
      {/* DNA Backbone */}
      {nodes.map((node, index) => {
        const nextNode = nodes[index + 1]
        if (!nextNode || node.strand !== nextNode.strand) return null

        return (
          <line key={`backbone-${index}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([...node.coords, ...nextNode.coords])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={node.strand === 0 ? "#3b82f6" : "#ef4444"} />
          </line>
        )
      })}

      {/* Process Nodes */}
      {nodes.map((node) => (
        <div key={node.index} style={{ position: "absolute", left: `${node.coords[0]}px`, top: `${node.coords[1]}px` }}>
          <div
            onClick={() => onNodeClick(node)}
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor:
                selectedNode?.index === node.index ? "#fbbf24" : node.strand === 0 ? "#3b82f6" : "#ef4444",
              transition: "transform 0.2s",
              transform: selectedNode?.index === node.index ? "scale(1.2)" : "scale(1)",
            }}
          />
          <div style={{ position: "absolute", left: "5px", top: "15px", color: "white", fontSize: "12px" }}>
            {node.base}
          </div>
        </div>
      ))}
    </div>
  )
}

function BirdsEyeView({
  nodes,
  forkSpirals,
  selectedNode,
  onNodeClick,
}: {
  nodes: ProcessNode[]
  forkSpirals: ForkSpiral[]
  selectedNode: ProcessNode | null
  onNodeClick: (node: ProcessNode) => void
}) {
  const getForkColor = (forkType?: string) => {
    switch (forkType) {
      case "if":
        return "#10b981"
      case "else":
        return "#f59e0b"
      case "loop":
        return "#8b5cf6"
      case "function_call":
        return "#06b6d4"
      case "merge":
        return "#f97316"
      default:
        return "#6b7280"
    }
  }

  return (
    <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
      <svg className="w-full h-full" viewBox="-60 -60 120 120">
        {/* Grid */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#374151" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Main Process Nodes */}
        {nodes.map((node) => {
          const radius = 15 + node.coords[2] / 3
          const angle = node.angle
          const x = radius * Math.cos(angle)
          const y = radius * Math.sin(angle)

          return (
            <g key={node.index}>
              <circle
                cx={x}
                cy={y}
                r={node.is_fork ? "3" : selectedNode?.index === node.index ? "2.5" : "2"}
                fill={
                  selectedNode?.index === node.index
                    ? "#fbbf24"
                    : node.is_fork
                      ? getForkColor(node.fork_type)
                      : node.strand === 0
                        ? "#3b82f6"
                        : "#ef4444"
                }
                stroke="white"
                strokeWidth="0.5"
                className="cursor-pointer"
                onClick={() => onNodeClick(node)}
              />
              <text x={x} y={y + 5} textAnchor="middle" fontSize="2.5" fill="white">
                {node.base}
              </text>
            </g>
          )
        })}

        {/* Center indicator */}
        <circle cx="0" cy="0" r="1" fill="#6b7280" />

        <g transform="translate(-55, -55)">
          <text x="0" y="0" fontSize="3" fill="white" fontWeight="bold">
            Fork Types:
          </text>
          <circle cx="0" cy="5" r="1" fill="#10b981" />
          <text x="3" y="7" fontSize="2.5" fill="white">
            IF
          </text>
          <circle cx="0" cy="10" r="1" fill="#f59e0b" />
          <text x="3" y="12" fontSize="2.5" fill="white">
            ELSE
          </text>
          <circle cx="0" cy="15" r="1" fill="#8b5cf6" />
          <text x="3" y="17" fontSize="2.5" fill="white">
            LOOP
          </text>
          <circle cx="0" cy="20" r="1" fill="#06b6d4" />
          <text x="3" y="22" fontSize="2.5" fill="white">
            CALL
          </text>
        </g>
      </svg>
    </div>
  )
}

export default function CodeMapPage() {
  const [mapData, setMapData] = useState<MapData[]>([])
  const [spiralNodes, setSpiralNodes] = useState<ProcessNode[]>([])
  const [forkSpirals, setForkSpirals] = useState<ForkSpiral[]>([])
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null)
  const [activeView, setActiveView] = useState<"3d" | "2d">("3d")
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    const generateSampleData = () => {
      const sampleProcesses = [
        { address: "A1", command: "calculate_sum", category: "math" },
        { address: "A2", command: "if market_open", category: "control", is_fork: true, fork_type: "if" },
        { address: "A3", command: "allocate_pyramid", category: "crypto" },
        { address: "A4", command: "calculate_cr", category: "crypto" },
        { address: "A5", command: "else handle_closed", category: "control", is_fork: true, fork_type: "else" },
        { address: "A6", command: "calculate_moving_averages", category: "analysis" },
        { address: "A7", command: "for each_stock", category: "control", is_fork: true, fork_type: "loop" },
        { address: "A8", command: "detect_market_sentiment", category: "ai" },
        { address: "A9", command: "execute_trades", category: "execution" },
        { address: "A10", command: "merge_results", category: "control", is_fork: true, fork_type: "merge" },
      ]

      // Generate main DNA spiral coordinates
      const base = 44
      const helixRadius = 12
      const pitch = 6

      const nodes: ProcessNode[] = sampleProcesses.map((process, i) => {
        const angle = (2 * Math.PI * i) / (base / 2)
        const height = (i * pitch) / (base / 2)
        const strand = i % 2

        // Main spiral: down-right, up-left
        const direction = height > 0 ? 1 : -1
        const spiralDirection = direction > 0 ? 1 : -1

        const x = helixRadius * Math.cos(angle + strand * Math.PI + spiralDirection * 0.1)
        const y = helixRadius * Math.sin(angle + strand * Math.PI + spiralDirection * 0.1)

        const bases = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
        const base_char = bases[i % bases.length]

        return {
          index: i,
          coords: [x, y, height] as [number, number, number],
          strand,
          base: base_char,
          complement: bases[bases.length - 1 - (i % bases.length)],
          angle,
          base_pair_id: `${base_char}-${bases[bases.length - 1 - (i % bases.length)]}`,
          command: process.command,
          category: process.category,
          is_fork: process.is_fork,
          fork_type: process.fork_type as any,
          spiral_id: "main",
        }
      })

      // Generate fork spirals
      const forks: ForkSpiral[] = [
        {
          id: "if-branch",
          fork_type: "if",
          parent_node: 1, // A2
          direction: "right",
          nodes: [
            {
              index: 100,
              coords: [18, 8, 12],
              strand: 0,
              base: "I1",
              complement: "C1",
              angle: 0.5,
              base_pair_id: "I1-C1",
              command: "check_balance",
              category: "validation",
              spiral_id: "if-branch",
            },
            {
              index: 101,
              coords: [16, 12, 18],
              strand: 1,
              base: "I2",
              complement: "C2",
              angle: 1.0,
              base_pair_id: "I2-C2",
              command: "validate_funds",
              category: "validation",
              spiral_id: "if-branch",
            },
          ],
        },
        {
          id: "loop-branch",
          fork_type: "loop",
          parent_node: 6, // A7
          direction: "left",
          nodes: [
            {
              index: 200,
              coords: [-18, -8, 36],
              strand: 0,
              base: "L1",
              complement: "R1",
              angle: 2.5,
              base_pair_id: "L1-R1",
              command: "process_stock",
              category: "processing",
              spiral_id: "loop-branch",
            },
            {
              index: 201,
              coords: [-16, -12, 42],
              strand: 1,
              base: "L2",
              complement: "R2",
              angle: 3.0,
              base_pair_id: "L2-R2",
              command: "analyze_trends",
              category: "analysis",
              spiral_id: "loop-branch",
            },
          ],
        },
      ]

      setSpiralNodes(nodes)
      setForkSpirals(forks)
      setMapData(
        sampleProcesses.map((p, i) => ({
          ...p,
          coords: nodes[i].coords,
          subprocesses: [],
          direction: null,
        })),
      )
      setIsLoading(false)
    }

    generateSampleData()
  }, [])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      math: "bg-blue-500",
      crypto: "bg-purple-500",
      analysis: "bg-green-500",
      ai: "bg-orange-500",
      execution: "bg-red-500",
      data: "bg-cyan-500",
      control: "bg-yellow-500",
      validation: "bg-emerald-500",
      processing: "bg-violet-500",
    }
    return colors[category] || "bg-gray-500"
  }

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading CodeMap System...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">CodeMap DNA Spiral</h1>
              <p className="text-muted-foreground">Base-44 Process Visualization with Fork Tracking</p>
            </div>
            <div className="flex gap-2">
              <Button variant={activeView === "3d" ? "default" : "outline"} onClick={() => setActiveView("3d")}>
                3D Spiral
              </Button>
              <Button variant={activeView === "2d" ? "default" : "outline"} onClick={() => setActiveView("2d")}>
                2D Bird's Eye
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visualization Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{activeView === "3d" ? "3D DNA Spiral with Forks" : "2D Bird's Eye with Forks"}</CardTitle>
                <CardDescription>
                  Interactive visualization showing main process spiral and branching fork spirals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 w-full">
                  {activeView === "3d" ? (
                    isMounted && (
                      <Canvas camera={{ position: [40, 25, 40], fov: 60 }}>
                        <ambientLight intensity={0.6} />
                        <pointLight position={[10, 10, 10]} />
                        <DNASpiral
                          nodes={spiralNodes}
                          forkSpirals={forkSpirals}
                          selectedNode={selectedNode}
                          onNodeClick={setSelectedNode}
                        />
                        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
                      </Canvas>
                    )
                  ) : (
                    <BirdsEyeView
                      nodes={spiralNodes}
                      forkSpirals={forkSpirals}
                      selectedNode={selectedNode}
                      onNodeClick={setSelectedNode}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Process Legend */}
            <Card>
              <CardHeader>
                <CardTitle>Process Legend</CardTitle>
                <CardDescription>Main spiral and fork locations</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-muted-foreground mb-2">Main Spiral:</div>
                    {mapData.map((process, index) => (
                      <div
                        key={process.address}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          selectedNode?.index === index ? "bg-primary/20" : "hover:bg-muted"
                        }`}
                        onClick={() => setSelectedNode(spiralNodes[index])}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">{process.address}</span>
                          <Badge className={getCategoryColor(process.category || "default")}>{process.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{process.command}</p>
                        {spiralNodes[index]?.is_fork && (
                          <p className="text-xs text-orange-400">Fork: {spiralNodes[index]?.fork_type}</p>
                        )}
                      </div>
                    ))}

                    <div className="text-sm font-semibold text-muted-foreground mt-4 mb-2">Fork Spirals:</div>
                    {forkSpirals.map((spiral) =>
                      spiral.nodes.map((node, nodeIndex) => (
                        <div
                          key={`fork-${spiral.id}-${nodeIndex}`}
                          className={`p-2 rounded cursor-pointer transition-colors border-l-2 ml-2 ${
                            selectedNode?.index === node.index ? "bg-primary/20" : "hover:bg-muted"
                          }`}
                          style={{
                            borderLeftColor:
                              spiral.fork_type === "if"
                                ? "#10b981"
                                : spiral.fork_type === "loop"
                                  ? "#8b5cf6"
                                  : "#6b7280",
                          }}
                          onClick={() => setSelectedNode(node)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">
                              {spiral.id}-{nodeIndex + 1}
                            </span>
                            <Badge
                              style={{
                                backgroundColor:
                                  spiral.fork_type === "if"
                                    ? "#10b981"
                                    : spiral.fork_type === "loop"
                                      ? "#8b5cf6"
                                      : "#6b7280",
                              }}
                            >
                              {spiral.fork_type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{node.command}</p>
                          <p className="text-xs text-muted-foreground">Direction: {spiral.direction}</p>
                        </div>
                      )),
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Selected Process Details */}
            {selectedNode && (
              <Card>
                <CardHeader>
                  <CardTitle>Process Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Address</label>
                      <p className="font-mono">
                        {selectedNode.spiral_id === "main"
                          ? mapData[selectedNode.index]?.address
                          : `${selectedNode.spiral_id}-${selectedNode.index}`}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Command</label>
                      <p className="text-sm">{selectedNode.command}</p>
                    </div>
                    {selectedNode.is_fork && (
                      <div>
                        <label className="text-sm font-medium">Fork Type</label>
                        <p className="text-sm capitalize">{selectedNode.fork_type}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium">Spiral</label>
                      <p className="text-sm">
                        {selectedNode.spiral_id === "main" ? "Main Process" : `Fork: ${selectedNode.spiral_id}`}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">3D Coordinates</label>
                      <p className="font-mono text-sm">[{selectedNode.coords.map((c) => c.toFixed(2)).join(", ")}]</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">DNA Base Pair</label>
                      <p className="font-mono">{selectedNode.base_pair_id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
