"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { Html } from "@react-three/drei" // Import Html for 3D labels

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
  fork_type?: "if" | "else" | "loop" | "function_call" | "merge" | "conditional"
  parent_index?: number
  fork_direction?: "left" | "right"
  spiral_id?: string
  isDuplicate?: boolean
  referenceTo?: number
  duplicateCount?: number
  references?: number[]
  address?: string // Added address property
  functionName?: string // Added functionName property
  code?: string // Added code property
}

// Define DNAProcess interface based on ProcessNode for clarity
interface DNAProcess extends ProcessNode {}

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

interface FunctionBlock {
  id: string
  name: string
  startAddress: number
  endAddress: number
  addresses: number[]
  lineComposition: string[]
  originalLines: string[]
  optimizedLines: string[]
  duplicateReplacements: { [key: string]: string }
  category: string
  description: string
}

interface FileAnalysis {
  fileName: string
  fileType: string
  totalLines: number
  duplicateLines: number
  uniqueLines: number
  energySavings: number
  optimizationPotential: number
  functionBlocks: number
  categories: { [key: string]: number }
}

interface ProjectAnalysis {
  totalFiles: number
  totalLines: number
  totalDuplicates: number
  overallEnergySavings: number
  optimizationPotential: number
  fileAnalyses: FileAnalysis[]
  globalDuplicates: { [key: string]: string[] }
}

interface AddressRegistry {
  [key: string]: {
    node: ProcessNode
    index: number
    dependencies: string[]
    executionFunction: () => Promise<any>
  }
}

interface PipelineCall {
  addressId?: string
  fromAddress?: string
  toAddress?: string
  timestamp: number
  status: "pending" | "summoning" | "executing" | "completed" | "failed"
  dependencies?: string[]
}

interface LibraryFunction {
  id: string
  name: string
  description: string
  code: string
  parameters: string[]
  returnType: string
  category: string
  tags: string[]
  dnaAddress: string
  usageCount: number
  dateCreated: string
  author: string
}

interface TerminalOutput {
  id: string
  type: "input" | "output" | "error" | "system"
  content: string
  timestamp: number
}

interface DeveloperProject {
  id: string
  name: string
  dnaStrands: { [key: string]: string[] }
  usedFunctions: { [key: string]: string }
  projectLibrary: LibraryFunction[]
  createdAt: string // Added for project creation timestamp
}

const COMMAND_LIBRARY = {
  // DNA Address Commands
  address: {
    description: "Execute function at DNA address",
    usage: "a<number> (e.g., a5, a12)",
    category: "DNA Operations",
  },
  run: {
    description: "Execute function at DNA address",
    usage: "run <address> (e.g., run a5)",
    category: "DNA Operations",
  },
  summon: {
    description: "Summon and execute address with full pipeline display",
    usage: "summon <address> (e.g., summon a5)",
    category: "DNA Operations",
  },

  // Function Library Commands
  search: {
    description: "Search function library",
    usage: "search <query> (e.g., search authentication)",
    category: "Function Library",
  },
  save: {
    description: "Save current function to library",
    usage: "save <name> <description>",
    category: "Function Library",
  },
  list: {
    description: "List all functions in library",
    usage: "list [category]",
    category: "Function Library",
  },

  // Project Management
  project: {
    description: "Show current project info",
    usage: "project",
    category: "Project Management",
  },
  new: {
    description: "Create new project",
    usage: "new <project_name>",
    category: "Project Management",
  },
  load: {
    description: "Load project",
    usage: "load <project_name>",
    category: "Project Management",
  },

  // Code Analysis
  analyze: {
    description: "Analyze code for duplicates and optimization",
    usage: "analyze [file_path]",
    category: "Code Analysis",
  },
  optimize: {
    description: "Show optimization suggestions",
    usage: "optimize",
    category: "Code Analysis",
  },
  stats: {
    description: "Show code statistics and efficiency metrics",
    usage: "stats",
    category: "Code Analysis",
  },

  // System Commands
  clear: {
    description: "Clear terminal output",
    usage: "clear",
    category: "System",
  },
  help: {
    description: "Show available commands",
    usage: "help [command] or help [category]",
    category: "System",
  },
  version: {
    description: "Show CodeMap version info",
    usage: "version",
    category: "System",
  },

  // Development Tools
  debug: {
    description: "Toggle debug mode",
    usage: "debug [on|off]",
    category: "Development",
  },
  export: {
    description: "Export current project",
    usage: "export [format]",
    category: "Development",
  },
  import: {
    description: "Import code file",
    usage: "import <file_path>",
    category: "Development",
  },
}

function detectFunctionBlocks(processes: ProcessNode[]): FunctionBlock[] {
  const blocks: FunctionBlock[] = []
  let currentBlock: Partial<FunctionBlock> | null = null

  const lineMap = new Map<string, number>()
  processes.forEach((process, index) => {
    const normalizedCommand = process.command?.toLowerCase().trim() || ""
    if (normalizedCommand && !lineMap.has(normalizedCommand)) {
      lineMap.set(normalizedCommand, index)
    }
  })

  processes.forEach((process, index) => {
    if (process.category === "function" || process.fork_type === "function_call") {
      if (currentBlock) {
        const blockAddresses = Array.from(
          { length: index - 1 - currentBlock.startAddress! + 1 },
          (_, i) => currentBlock.startAddress! + i,
        )

        const { lineComposition, originalLines, optimizedLines, duplicateReplacements } = createLineComposition(
          blockAddresses,
          processes,
          lineMap,
        )

        blocks.push({
          ...currentBlock,
          endAddress: index - 1,
          addresses: blockAddresses,
          lineComposition,
          originalLines,
          optimizedLines,
          duplicateReplacements,
        } as FunctionBlock)
      }

      currentBlock = {
        id: `func-${blocks.length + 1}`,
        name: process.command?.replace(/def |function /, "") || `Function ${blocks.length + 1}`,
        startAddress: index,
        category: process.category || "general",
        description: `Function block starting at A${index + 1}`,
      }
    }

    if (process.command?.includes("return") || process.fork_type === "merge") {
      if (currentBlock) {
        const blockAddresses = Array.from(
          { length: index - currentBlock.startAddress! + 1 },
          (_, i) => currentBlock.startAddress! + i,
        )

        const { lineComposition, originalLines, optimizedLines, duplicateReplacements } = createLineComposition(
          blockAddresses,
          processes,
          lineMap,
        )

        blocks.push({
          ...currentBlock,
          endAddress: index,
          addresses: blockAddresses,
          lineComposition,
          originalLines,
          optimizedLines,
          duplicateReplacements,
        } as FunctionBlock)
        currentBlock = null
      }
    }
  })

  if (currentBlock) {
    const blockAddresses = Array.from(
      { length: processes.length - currentBlock.startAddress! },
      (_, i) => currentBlock.startAddress! + i,
    )

    const { lineComposition, originalLines, optimizedLines, duplicateReplacements } = createLineComposition(
      blockAddresses,
      processes,
      lineMap,
    )

    blocks.push({
      ...currentBlock,
      endAddress: processes.length - 1,
      addresses: blockAddresses,
      lineComposition,
      originalLines,
      optimizedLines,
      duplicateReplacements,
    } as FunctionBlock)
  }

  return blocks
}

function createLineComposition(
  addresses: number[],
  processes: ProcessNode[],
  lineMap: Map<string, number>,
): {
  lineComposition: string[]
  originalLines: string[]
  optimizedLines: string[]
  duplicateReplacements: { [key: string]: string }
} {
  const originalLines: string[] = []
  const optimizedLines: string[] = []
  const duplicateReplacements: { [key: string]: string } = {}

  addresses.forEach((addressIndex) => {
    const process = processes[addressIndex]
    const normalizedCommand = process.command?.toLowerCase().trim() || ""
    const lineRef = `a${addressIndex + 1}`

    originalLines.push(lineRef)

    const firstOccurrence = lineMap.get(normalizedCommand)
    if (firstOccurrence !== undefined && firstOccurrence < addressIndex) {
      const originalRef = `a${firstOccurrence + 1}`
      optimizedLines.push(originalRef)
      duplicateReplacements[lineRef] = originalRef
    } else {
      optimizedLines.push(lineRef)
    }
  })

  return {
    lineComposition: optimizedLines,
    originalLines,
    optimizedLines,
    duplicateReplacements,
  }
}

function detectCodeDuplicates(processes: ProcessNode[]): ProcessNode[] {
  const codeMap = new Map<string, ProcessNode[]>()
  const uniqueProcesses: ProcessNode[] = []

  processes.forEach((process) => {
    const normalizedCommand = process.command?.toLowerCase().trim() || ""
    if (!codeMap.has(normalizedCommand)) {
      codeMap.set(normalizedCommand, [])
    }
    codeMap.get(normalizedCommand)!.push(process)
  })

  codeMap.forEach((duplicates, command) => {
    if (duplicates.length > 1) {
      const primary = duplicates[0]
      uniqueProcesses.push({
        ...primary,
        isDuplicate: false,
        duplicateCount: duplicates.length,
        references: duplicates.slice(1).map((d) => d.index),
      })

      duplicates.slice(1).forEach((duplicate) => {
        uniqueProcesses.push({
          ...duplicate,
          isDuplicate: true,
          referenceTo: primary.index,
          command: `→ REF A${primary.index + 1}: ${command}`,
        })
      })
    } else {
      uniqueProcesses.push({
        ...duplicates[0],
        isDuplicate: false,
      })
    }
  })

  return uniqueProcesses.sort((a, b) => a.index - b.index)
}

function DNASpiral({
  nodes,
  forkSpirals,
  selectedNode,
  onNodeClick,
  onAddressClick,
  setSelectedFunctionCode,
  setShowCodeModal,
}: any) {
  const helixRadius = 10
  const pitch = 5
  const base = 44

  return (
    <group>
      {/* Central axis lines */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 25, 0, 0, -25, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#06b6d4" linewidth={8} />
      </line>

      {nodes?.map((node, index) => {
        const angle = (2 * Math.PI * index) / (base / 2)
        const height = (index * pitch) / (base / 2)
        const yPos = 20 - height * 2

        // Main strand (strand 0)
        const strand = index % 2
        const mainXPos = helixRadius * Math.cos(angle)
        const mainZPos = helixRadius * Math.sin(angle)

        // Complementary strand (strand 1) - 180 degrees offset
        const compXPos = helixRadius * Math.cos(angle + Math.PI)
        const compZPos = helixRadius * Math.sin(angle + Math.PI)

        const nextIndex = index + 1
        if (nextIndex < nodes.length) {
          const nextAngle = (2 * Math.PI * nextIndex) / (base / 2)
          const nextHeight = (nextIndex * pitch) / (base / 2)
          const nextYPos = 20 - nextHeight * 2

          const nextMainXPos = helixRadius * Math.cos(nextAngle)
          const nextMainZPos = helixRadius * Math.sin(nextAngle)
          const nextCompXPos = helixRadius * Math.cos(nextAngle + Math.PI)
          const nextCompZPos = helixRadius * Math.sin(nextAngle + Math.PI)

          return (
            <group key={`dna-helix-${index}`}>
              {/* Main strand connection */}
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([mainXPos, yPos, mainZPos, nextMainXPos, nextYPos, nextMainZPos])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#06b6d4" linewidth={4} />
              </line>

              {/* Complementary strand connection */}
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([compXPos, yPos, compZPos, nextCompXPos, nextYPos, nextCompZPos])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#22d3ee" linewidth={3} />
              </line>

              {/* Base pair connections (every 3rd pair for clarity) */}
              {index % 3 === 0 && (
                <line>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={2}
                      array={new Float32Array([mainXPos, yPos, mainZPos, compXPos, yPos, compZPos])}
                      itemSize={3}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial color="#ffffff" linewidth={1} transparent opacity={0.4} />
                </line>
              )}

              <group>
                <mesh
                  position={[mainXPos, yPos, mainZPos]}
                  onClick={() => {
                    onAddressClick?.(node.address)
                    setSelectedFunctionCode({
                      name: node.functionName || `Function ${index + 1}`,
                      address: node.address,
                      code:
                        node.code ||
                        `// Function code for ${node.functionName || `Function ${index + 1}`}\nfunction ${node.functionName || `func${index + 1}`}() {\n  // Implementation here\n  return result;\n}`,
                      category: node.category || "general",
                    })
                    setShowCodeModal(true)
                  }}
                >
                  <sphereGeometry args={[0.5]} />
                  <meshBasicMaterial
                    color={selectedNode?.index === index ? "#ffffff" : "#06b6d4"}
                    transparent
                    opacity={0.9}
                  />
                </mesh>

                <Html position={[mainXPos, yPos + 1.5, mainZPos]} center>
                  <div className="text-xs text-cyan-300 font-mono bg-black/50 px-1 py-0.5 rounded border border-cyan-500/30 whitespace-nowrap">
                    {node.functionName || `func${index + 1}`}
                  </div>
                </Html>
              </group>

              {/* Subprocess nodes */}
              <mesh position={[compXPos, yPos, compZPos]}>
                <sphereGeometry args={[0.3]} />
                <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} />
              </mesh>
            </group>
          )
        }

        return null
      })}

      {/* Pipeline flow animation */}
      {Array.from({ length: 20 }, (_, i) => {
        const yPos = 22 - i * 2.2
        const time = Date.now() * 0.002
        const angle = time + i * 0.3
        const radius = 2 + Math.sin(time + i * 0.5) * 0.5
        const xOffset = radius * Math.cos(angle)
        const zOffset = radius * Math.sin(angle)

        return (
          <mesh key={`pipeline-flow-${i}`} position={[xOffset, yPos, zOffset]}>
            <sphereGeometry args={[0.2]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.8 - i * 0.03} />
          </mesh>
        )
      })}
    </group>
  )
}

function BirdsEyeView({
  nodes,
  selectedNode,
  executingProcess,
  functionBlocks,
  expandedBlocks,
  setSelectedFunctionCode,
  setShowCodeModal,
}: any) {
  const safeNodes = nodes || []
  const safeFunctionBlocks = functionBlocks || []
  const safeExpandedBlocks = expandedBlocks || []

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-cyan-500/10 via-transparent to-transparent animate-pulse"></div>

      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <svg width="100%" height="100%" viewBox="0 0 400 400" className="absolute inset-0">
        <circle
          cx="200"
          cy="200"
          r="120"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="3"
          opacity="0.6"
          className="animate-pulse"
        />
        <circle cx="200" cy="200" r="80" fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0.4" />
        <circle cx="200" cy="200" r="40" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />

        {safeFunctionBlocks.map((block: FunctionBlock, blockIndex: number) => {
          const isExpanded = safeExpandedBlocks.includes(block.id)
          const spiralRadius = 60 + blockIndex * 25
          const spiralAngle = (blockIndex * Math.PI * 2) / Math.max(safeFunctionBlocks.length, 1)
          const centerX = 200 + spiralRadius * Math.cos(spiralAngle)
          const centerY = 200 + spiralRadius * Math.sin(spiralAngle)

          return (
            <g key={block.id}>
              <circle
                cx={centerX}
                cy={centerY}
                r={isExpanded ? 45 : 30}
                fill="none"
                stroke={isExpanded ? "#06b6d4" : "#22d3ee"}
                strokeWidth={isExpanded ? 3 : 2}
                strokeDasharray={isExpanded ? "8,4" : "4,2"}
                className={isExpanded ? "animate-pulse" : ""}
                filter="url(#glow)"
              />

              {(block.addresses || []).map((addressIndex, i) => {
                const node = safeNodes[addressIndex]
                if (!node) return null

                // Better spiral positioning within cluster
                const nodeAngle = (i / block.addresses.length) * Math.PI * 2
                const nodeRadius = isExpanded ? 35 : 20
                const nodeX = centerX + nodeRadius * Math.cos(nodeAngle)
                const nodeY = centerY + nodeRadius * Math.sin(nodeAngle)

                return (
                  <g key={`address-${addressIndex}`}>
                    <circle
                      cx={nodeX}
                      cy={nodeY}
                      r={selectedNode?.index === addressIndex ? 8 : 6}
                      fill={
                        executingProcess?.index === addressIndex
                          ? "#ffffff"
                          : selectedNode?.index === addressIndex
                            ? "#06b6d4"
                            : node.isDuplicate
                              ? "#dc2626"
                              : "#22d3ee"
                      }
                      className={executingProcess?.index === addressIndex ? "animate-pulse" : ""}
                      filter="url(#glow)"
                      onClick={() => {
                        setSelectedFunctionCode({
                          name: node.functionName || `Function ${addressIndex + 1}`,
                          address: node.address,
                          code:
                            node.code ||
                            `// Function code for ${node.functionName || `Function ${addressIndex + 1}`}\nfunction ${node.functionName || `func${addressIndex + 1}`}() {\n  // Implementation here\n  return result;\n}`,
                          category: node.category || "general",
                        })
                        setShowCodeModal(true)
                      }}
                      style={{ cursor: "pointer" }}
                    />

                    <text
                      x={nodeX}
                      y={nodeY - 12}
                      textAnchor="middle"
                      className="text-xs fill-cyan-300 font-mono font-bold"
                      filter="url(#textGlow)"
                    >
                      {node.functionName || `F${addressIndex + 1}`}
                    </text>
                  </g>
                )
              })}

              <text
                x={centerX}
                y={centerY + (isExpanded ? 55 : 40)}
                textAnchor="middle"
                className="text-sm fill-white font-mono font-bold"
                filter="url(#textGlow)"
              >
                {block.name}
              </text>
            </g>
          )
        })}

        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="textGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  )
}

const FunctionCodeModal = ({ isOpen, onClose, functionData }: any) => {
  if (!isOpen || !functionData) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/30">
          <div>
            <h3 className="text-lg font-mono font-bold text-cyan-300">{functionData.name}</h3>
            <p className="text-sm text-cyan-500">Address: {functionData.address}</p>
          </div>
          <button onClick={onClose} className="text-cyan-300 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[60vh]">
          <pre className="text-sm text-cyan-100 font-mono bg-black/50 p-4 rounded border border-cyan-500/20 overflow-x-auto">
            <code>{functionData.code}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

const Page = () => {
  const [isMounted, setIsMounted] = useState(false)
  const [showFileLoader, setShowFileLoader] = useState(false)
  const [activeView, setActiveView] = useState("3d")
  const [dragActive, setDragActive] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [projectAnalysis, setProjectAnalysis] = useState<ProjectAnalysis | null>(null)
  const [loadedFiles, setLoadedFiles] = useState<File[]>([])
  const [spiralNodes, setSpiralNodes] = useState<ProcessNode[]>([])
  const [functionBlocks, setFunctionBlocks] = useState<FunctionBlock[]>([])
  const [forkSpirals, setForkSpirals] = useState<ForkSpiral[]>([])
  const [mapData, setMapData] = useState<MapData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null)
  const [currentExecutingLine, setCurrentExecutingLine] = useState<number | null>(null)
  const [runningBlock, setRunningBlock] = useState<FunctionBlock | null>(null)
  const [expandedBlocks, setExpandedBlocks] = useState<string[]>([])
  const [inputCode, setInputCode] = useState("")

  const [showCodeModal, setShowCodeModal] = useState(false)
  const [selectedFunctionCode, setSelectedFunctionCode] = useState<any>(null)

  const [addressRegistry, setAddressRegistry] = useState<AddressRegistry>({})
  const [pipelineCalls, setPipelineCalls] = useState<PipelineCall[]>([])
  const [activeSummons, setActiveSummons] = useState<string[]>([])

  const [hasError, setHasError] = useState(false)

  const [functionLibrary, setFunctionLibrary] = useState<LibraryFunction[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredFunctions, setFilteredFunctions] = useState<LibraryFunction[]>([])
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput[]>([])
  const [terminalInput, setTerminalInput] = useState("")
  const [currentProject, setCurrentProject] = useState<DeveloperProject | null>(null)
  const [showTerminal, setShowTerminal] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [selectedFunction, setSelectedFunction] = useState<LibraryFunction | null>(null)

  const handleAddressClick = (node: ProcessNode, index: number) => {
    setSelectedNode(node)
    setCurrentExecutingLine(index)
  }

  const summonAddress = async (addressId: string) => {
    const registryEntry = addressRegistry[addressId]
    if (!registryEntry) {
      console.error(`[v0] Address ${addressId} not found in registry`)
      addTerminalOutput("error", `Address ${addressId} not found in registry`)
      return null
    }

    // Show summon activity in terminal
    addTerminalOutput("system", `🔮 Summoning address ${addressId}...`)

    // Create pipeline call record
    const call: PipelineCall = {
      addressId,
      timestamp: Date.now(),
      status: "summoning",
      dependencies: registryEntry.dependencies,
    }

    setPipelineCalls((prev) => [...prev, call])
    setActiveSummons((prev) => [...prev, addressId])

    try {
      // Update call status
      setPipelineCalls((prev) => prev.map((c) => (c.timestamp === call.timestamp ? { ...c, status: "executing" } : c)))
      addTerminalOutput("system", `⚡ Executing ${addressId}: ${registryEntry.node.command}`)

      // Execute the summoned address
      const result = await registryEntry.executionFunction()

      // Mark as completed
      setPipelineCalls((prev) => prev.map((c) => (c.timestamp === call.timestamp ? { ...c, status: "completed" } : c)))
      addTerminalOutput("output", `✅ ${addressId} completed: ${JSON.stringify(result, null, 2)}`)

      return result
    } catch (error) {
      // Mark as failed
      setPipelineCalls((prev) => prev.map((c) => (c.timestamp === call.timestamp ? { ...c, status: "failed" } : c)))
      console.error(`[v0] Failed to execute ${addressId}:`, error)
      addTerminalOutput("error", `❌ ${addressId} failed: ${error}`)
      return null
    } finally {
      setActiveSummons((prev) => prev.filter((addr) => addr !== addressId))
    }
  }

  const buildAddressRegistry = (processes: ProcessNode[]) => {
    const registry: AddressRegistry = {}

    processes.forEach((node, index) => {
      const addressId = `a${index + 1}`

      // Determine dependencies by analyzing the command
      const dependencies: string[] = []
      if (node.command) {
        // Look for address references in the command (like calling other functions)
        const addressMatches = node.command.match(/a\d+/g)
        if (addressMatches) {
          dependencies.push(...addressMatches.filter((addr) => addr !== addressId))
        }
      }

      // Create execution function for this address
      const executionFunction = async () => {
        console.log(`[v0] Executing ${addressId}: ${node.command}`)
        setCurrentExecutingLine(index)

        // Simulate execution time based on command complexity
        const executionTime = node.command?.length ? Math.min(node.command.length * 10, 2000) : 500
        await new Promise((resolve) => setTimeout(resolve, executionTime))

        setCurrentExecutingLine(null)
        return { addressId, result: `Executed: ${node.command}`, timestamp: Date.now() }
      }

      registry[addressId] = {
        node,
        index,
        dependencies,
        executionFunction,
      }
    })

    setAddressRegistry(registry)
    return registry
  }

  const runFromHere = async (startIndex: number) => {
    const addressId = `a${startIndex + 1}`
    const blockToRun = functionBlocks.find((block) => block.startAddress === startIndex)

    if (blockToRun) {
      setRunningBlock(blockToRun)

      // Summon all addresses in the block sequentially
      for (const addr of blockToRun.optimizedLines) {
        await summonAddress(addr)
        // Small delay between summons for visual effect
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      setRunningBlock(null)
    } else {
      // Summon single address
      await summonAddress(addressId)
    }
  }

  const addToLibrary = (functionCode: string, name: string, description: string, category: string) => {
    const newFunction: LibraryFunction = {
      id: `lib-${Date.now()}`,
      name,
      description,
      code: functionCode,
      parameters: extractParameters(functionCode),
      returnType: extractReturnType(functionCode),
      tags: extractTags(functionCode),
      dnaAddress: `L${functionLibrary.length + 1}`,
      usageCount: 0,
      dateCreated: new Date().toISOString(),
      author: "Developer",
    }

    setFunctionLibrary((prev) => [...prev, newFunction])
    addTerminalOutput("system", `Function "${name}" added to library with address ${newFunction.dnaAddress}`)
  }

  const searchFunctions = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredFunctions(functionLibrary)
      return
    }

    const filtered = functionLibrary.filter(
      (func) =>
        func.name.toLowerCase().includes(query.toLowerCase()) ||
        func.description.toLowerCase().includes(query.toLowerCase()) ||
        func.category.toLowerCase().includes(query.toLowerCase()) ||
        func.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
    )
    setFilteredFunctions(filtered)
  }

  const addFunctionToProject = (libraryFunction: LibraryFunction) => {
    if (!currentProject) {
      const newProject: DeveloperProject = {
        id: `proj-${Date.now()}`,
        name: "New Project",
        dnaStrands: {},
        usedFunctions: {},
        projectLibrary: [],
        createdAt: new Date().toISOString(), // Set creation timestamp
      }
      setCurrentProject(newProject)
    }

    // Create a unique DNA address for this project usage
    const projectAddress = `P${Object.keys(currentProject?.usedFunctions || {}).length + 1}`

    setCurrentProject((prev) =>
      prev
        ? {
            ...prev,
            usedFunctions: {
              ...prev.usedFunctions,
              [projectAddress]: libraryFunction.dnaAddress,
            },
          }
        : null,
    )

    // Update usage count in library
    setFunctionLibrary((prev) =>
      prev.map((func) => (func.id === libraryFunction.id ? { ...func, usageCount: func.usageCount + 1 } : func)),
    )

    addTerminalOutput(
      "system",
      `Function "${libraryFunction.name}" assigned address ${projectAddress} in current project`,
    )
  }

  const addTerminalOutput = (type: TerminalOutput["type"], content: string) => {
    const output: TerminalOutput = {
      id: `term-${Date.now()}`,
      type,
      content,
      timestamp: Date.now(),
    }
    setTerminalOutput((prev) => [...prev, output])
  }

  const executeTerminalCommand = async (command: string) => {
    addTerminalOutput("input", `> ${command}`)

    try {
      const [cmd, ...args] = command.trim().split(" ")

      // Handle direct address input (like "a5" instead of "run a5")
      if (/^a\d+$/.test(cmd)) {
        const address = cmd
        if (addressRegistry[address]) {
          const result = await summonAddress(address)
        } else {
          addTerminalOutput("error", `Address ${address} not found`)
        }
      } else if (cmd === "run" && args[0]) {
        const address = args[0]
        if (addressRegistry[address]) {
          const result = await summonAddress(address)
        } else {
          addTerminalOutput("error", `Address ${address} not found`)
        }
      } else if (cmd === "summon" && args[0]) {
        const address = args[0]
        if (addressRegistry[address]) {
          addTerminalOutput("system", `🔮 Summoning ${address}...`)
          const result = await summonAddress(address)
        } else {
          addTerminalOutput("error", `Address ${address} not found`)
        }
      } else if (cmd === "search" && args[0]) {
        const query = args.join(" ")
        searchFunctions(query)
        addTerminalOutput("output", `🔍 Found ${filteredFunctions.length} functions matching "${query}"`)
      } else if (cmd === "list") {
        const category = args[0]
        if (category) {
          const categoryFunctions = functionLibrary.filter((f) => f.category === category)
          addTerminalOutput(
            "output",
            `📚 Functions in ${category}:\n${categoryFunctions.map((f) => `  ${f.dnaAddress}: ${f.name}`).join("\n")}`,
          )
        } else {
          addTerminalOutput(
            "output",
            `📚 Function Library (${functionLibrary.length} functions):\n${functionLibrary.map((f) => `  ${f.dnaAddress}: ${f.name} [${f.category}]`).join("\n")}`,
          )
        }
      } else if (cmd === "project") {
        if (currentProject) {
          addTerminalOutput(
            "output",
            `📁 Current Project: ${currentProject.name}\n  Functions Used: ${Object.keys(currentProject.usedFunctions).length}\n  Created: ${new Date(currentProject.createdAt).toLocaleString()}`,
          )
        } else {
          addTerminalOutput("output", "📁 No active project")
        }
      } else if (cmd === "analyze") {
        // Use spiralNodes for analysis, assuming they represent the current code being analyzed
        const duplicateCount = spiralNodes.filter((n) => n.isDuplicate).length
        const totalLines = spiralNodes.length
        const efficiency = totalLines > 0 ? (((totalLines - duplicateCount) / totalLines) * 100).toFixed(1) : "0"
        addTerminalOutput(
          "output",
          `🔬 Code Analysis:\n  Total Lines: ${totalLines}\n  Duplicates: ${duplicateCount}\n  Efficiency: ${efficiency}%`,
        )
      } else if (cmd === "stats") {
        const totalFunctions = functionLibrary.length
        const totalProjects = currentProject ? 1 : 0 // Simple count for now
        // Estimate energy saved based on duplicate lines in the current spiralNodes
        const estimatedEnergySaved = Math.floor(spiralNodes.filter((n) => n.isDuplicate).length * 0.1) // Example: 0.1 kWh per duplicate line
        addTerminalOutput(
          "output",
          `📊 CodeMap Statistics:\n  Functions in Library: ${totalFunctions}\n  Active Projects: ${totalProjects}\n  Estimated Energy Saved (current): ${estimatedEnergySaved} kWh`,
        )
      } else if (cmd === "version") {
        addTerminalOutput(
          "output",
          `🧬 CodeMap DNA v1.0.0\n  Advanced Code Optimization Platform\n  Energy-Efficient Development Tools`,
        )
      } else if (cmd === "debug") {
        const mode = args[0] === "off" ? false : true
        addTerminalOutput("system", `🐛 Debug mode ${mode ? "enabled" : "disabled"}`)
      } else if (cmd === "clear") {
        setTerminalOutput([])
      } else if (cmd === "help") {
        const target = args[0]
        if (target && COMMAND_LIBRARY[target]) {
          const cmdInfo = COMMAND_LIBRARY[target]
          addTerminalOutput(
            "output",
            `📖 ${target.toUpperCase()}\n  ${cmdInfo.description}\n  Usage: ${cmdInfo.usage}\n  Category: ${cmdInfo.category}`,
          )
        } else if (target) {
          // Show commands in category
          const categoryCommands = Object.entries(COMMAND_LIBRARY).filter(
            ([_, info]) => info.category.toLowerCase() === target.toLowerCase(),
          )
          if (categoryCommands.length > 0) {
            addTerminalOutput(
              "output",
              `📖 ${target.toUpperCase()} COMMANDS:\n${categoryCommands.map(([cmd, info]) => `  ${cmd}: ${info.description}`).join("\n")}`,
            )
          } else {
            addTerminalOutput("error", `No help found for "${target}"`)
          }
        } else {
          // Show all commands organized by category
          const categories = [...new Set(Object.values(COMMAND_LIBRARY).map((cmd) => cmd.category))]
          let helpText = "📖 CODEMAP COMMAND LIBRARY\n\n"
          categories.forEach((category) => {
            helpText += `${category.toUpperCase()}:\n`
            Object.entries(COMMAND_LIBRARY)
              .filter(([_, info]) => info.category === category)
              .forEach(([cmd, info]) => {
                helpText += `  ${cmd.padEnd(12)} ${info.description}\n`
              })
            helpText += "\n"
          })
          helpText += "Type 'help <command>' for detailed usage or 'help <category>' for category commands."
          addTerminalOutput("output", helpText)
        }
      } else {
        // Try to execute as JavaScript
        const result = eval(command)
        addTerminalOutput("output", String(result))
      }
    } catch (error) {
      addTerminalOutput("error", `Error: ${error}`)
    }
  }

  const extractParameters = (code: string): string[] => {
    const match = code.match(/function\s+\w+\s*$$([^)]*)$$/)
    if (match && match[1]) {
      return match[1]
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p)
    }
    return []
  }

  const extractReturnType = (code: string): string => {
    if (code.includes("return ")) return "any"
    return "void"
  }

  const extractTags = (code: string): string[] => {
    const tags = []
    if (code.includes("async")) tags.push("async")
    if (code.includes("Promise")) tags.push("promise")
    if (code.includes("fetch")) tags.push("api")
    if (code.includes("console.log")) tags.push("debug")
    return tags
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "dna operations":
        return "bg-primary"
      case "function library":
        return "bg-secondary"
      case "project management":
        return "bg-accent"
      case "code analysis":
        return "bg-chart-3"
      case "system":
        return "bg-destructive"
      case "development":
        return "bg-purple-500"
      case "math":
        return "bg-green-500"
      case "control":
        return "bg-orange-500"
      case "data":
        return "bg-blue-500"
      case "validation":
        return "bg-pink-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>,
    setProjectAnalysis: React.Dispatch<React.SetStateAction<ProjectAnalysis | null>>,
    setSpiralNodes: React.Dispatch<React.SetStateAction<ProcessNode[]>>,
    setFunctionBlocks: React.Dispatch<React.SetStateAction<FunctionBlock[]>>,
    setInputCode: React.Dispatch<React.SetStateAction<string>>,
    setLoadedFiles: React.Dispatch<React.SetStateAction<File[]>>,
    setDragActive: React.Dispatch<React.SetStateAction<boolean>>,
    setIsMounted: React.Dispatch<React.SetStateAction<boolean>>,
    setForkSpirals: React.Dispatch<React.SetStateAction<ForkSpiral[]>>,
    setMapData: React.Dispatch<React.SetStateAction<MapData[]>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setShowFileLoader: React.Dispatch<React.SetStateAction<boolean>>,
    setActiveView: React.Dispatch<React.SetStateAction<string>>,
    setSelectedNode: React.Dispatch<React.SetStateAction<ProcessNode | null>>,
    setRunningBlock: React.Dispatch<React.SetStateAction<FunctionBlock | null>>,
    setExpandedBlocks: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    e.preventDefault()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files, {
      setIsAnalyzing,
      setProjectAnalysis,
      setSpiralNodes,
      setFunctionBlocks,
      setInputCode,
      setLoadedFiles,
      setIsMounted,
      setForkSpirals,
      setMapData,
      setIsLoading,
      setShowFileLoader,
      setActiveView,
      setSelectedNode,
      setRunningBlock,
      setExpandedBlocks,
    })
  }

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    setDragActive: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (
    e: React.DragEvent<HTMLDivElement>,
    setDragActive: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleFileUploadMultiple = (
    e: React.ChangeEvent<HTMLInputElement>,
    setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>,
    setProjectAnalysis: React.Dispatch<React.SetStateAction<ProjectAnalysis | null>>,
    setSpiralNodes: React.Dispatch<React.SetStateAction<ProcessNode[]>>,
    setFunctionBlocks: React.Dispatch<React.SetStateAction<FunctionBlock[]>>,
    setInputCode: React.Dispatch<React.SetStateAction<string>>,
    setLoadedFiles: React.Dispatch<React.SetStateAction<File[]>>,
    setIsMounted: React.Dispatch<React.SetStateAction<boolean>>,
    setForkSpirals: React.Dispatch<React.SetStateAction<ForkSpiral[]>>,
    setMapData: React.Dispatch<React.SetStateAction<MapData[]>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setShowFileLoader: React.Dispatch<React.SetStateAction<boolean>>,
    setActiveView: React.Dispatch<React.SetStateAction<string>>,
    setSelectedNode: React.Dispatch<React.SetStateAction<ProcessNode | null>>,
    setRunningBlock: React.Dispatch<React.SetStateAction<FunctionBlock | null>>,
    setExpandedBlocks: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files, {
      setIsAnalyzing,
      setProjectAnalysis,
      setSpiralNodes,
      setFunctionBlocks,
      setInputCode,
      setLoadedFiles,
      setIsMounted,
      setForkSpirals,
      setMapData,
      setIsLoading,
      setShowFileLoader,
      setActiveView,
      setSelectedNode,
      setRunningBlock,
      setExpandedBlocks,
    })
  }

  const handleFiles = async (
    files: File[],
    setters: {
      setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>
      setProjectAnalysis: React.Dispatch<React.SetStateAction<ProjectAnalysis | null>>
      setSpiralNodes: React.Dispatch<React.SetStateAction<ProcessNode[]>>
      setFunctionBlocks: React.Dispatch<React.SetStateAction<FunctionBlock[]>>
      setInputCode: React.Dispatch<React.SetStateAction<string>>
      setLoadedFiles: React.Dispatch<React.SetStateAction<File[]>>
      setIsMounted: React.Dispatch<React.SetStateAction<boolean>>
      setForkSpirals: React.Dispatch<React.SetStateAction<ForkSpiral[]>>
      setMapData: React.Dispatch<React.SetStateAction<MapData[]>>
      setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
      setShowFileLoader: React.Dispatch<React.SetStateAction<boolean>>
      setActiveView: React.Dispatch<React.SetStateAction<string>>
      setSelectedNode: React.Dispatch<React.SetStateAction<ProcessNode | null>>
      setRunningBlock: React.Dispatch<React.SetStateAction<FunctionBlock | null>>
      setExpandedBlocks: React.Dispatch<React.SetStateAction<string[]>>
    },
  ) => {
    setters.setIsAnalyzing(true)
    setters.setLoadedFiles(files)
    setters.setShowFileLoader(false)

    // Simulate analysis and data generation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const sampleProjectAnalysis: ProjectAnalysis = {
      totalFiles: files.length,
      totalLines: 5000 + files.length * 100,
      totalDuplicates: 500 + files.length * 20,
      overallEnergySavings: 15.5,
      optimizationPotential: 25.0,
      fileAnalyses: files.map((file) => ({
        fileName: file.name,
        fileType: file.name.split(".").pop() || "unknown",
        totalLines: 1000,
        duplicateLines: 100,
        uniqueLines: 900,
        energySavings: 10.2,
        optimizationPotential: 20.0,
        functionBlocks: Math.floor(Math.random() * 5),
        categories: {
          logic: 3,
          ui: 2,
          api: 1,
        },
      })),
      globalDuplicates: {
        common_function_a: ["file1.js", "file2.ts"],
        duplicate_loop_b: ["file3.py", "file4.java"],
      },
    }

    const sampleNodes: ProcessNode[] = Array.from({ length: 50 }, (_, i) => {
      const angle = (i / 50) * Math.PI * 5
      const radius = 10
      const height = 25 - i * 0.5
      const smoothAngle = angle + Math.sin(angle * 2) * 0.3
      const command = [
        "fetch_data",
        "process_data",
        "render_ui",
        "save_config",
        "validate_input",
        "calculate_sum",
        "if_condition",
        "loop_items",
      ][i % 8]
      const category = ["data", "data", "ui", "config", "validation", "math", "control", "control"][i % 8]
      const isDuplicate = i % 5 === 0
      const duplicateCount = isDuplicate ? Math.floor(Math.random() * 3) + 2 : 1
      const referenceTo = isDuplicate ? i - Math.floor(Math.random() * 5) - 1 : undefined

      return {
        index: i,
        coords: [Math.cos(smoothAngle) * radius, height, Math.sin(smoothAngle) * radius] as [number, number, number],
        strand: i % 2,
        base: ["A", "T", "C", "G"][i % 4],
        complement: ["T", "A", "G", "C"][i % 4],
        angle: 0,
        base_pair_id: `bp-${i}`,
        command: `${command}_${i}`,
        category: category,
        isDuplicate: isDuplicate,
        duplicateCount: duplicateCount,
        referenceTo: referenceTo,
        address: `a${i + 1}`,
        functionName: `${command}_${i}`,
        code: `function ${command}_${i}() {\n  // Sample code for ${command}\n  console.log('Executing ${command}_${i}');\n  return ${Math.random()};\n}`,
      }
    })

    const sampleFunctionBlocks: FunctionBlock[] = [
      {
        id: "func-1",
        name: "Data Processing Pipeline",
        startAddress: 1,
        endAddress: 5,
        addresses: [1, 2, 3, 4, 5],
        lineComposition: ["a2", "a3", "a4", "a5"],
        originalLines: ["a2", "a3", "a4", "a5"],
        optimizedLines: ["a2", "a3", "a4", "a5"],
        duplicateReplacements: {},
        category: "data",
        description: "Processes fetched data",
      },
      {
        id: "func-2",
        name: "UI Rendering",
        startAddress: 7,
        endAddress: 10,
        addresses: [7, 8, 9, 10],
        lineComposition: ["a8", "a9", "a10"],
        originalLines: ["a7", "a8", "a9", "a10"],
        optimizedLines: ["a7", "a8", "a9", "a10"],
        duplicateReplacements: {},
        category: "ui",
        description: "Renders the user interface",
      },
    ]

    setters.setProjectAnalysis(sampleProjectAnalysis)
    setters.setSpiralNodes(sampleNodes)
    setters.setFunctionBlocks(sampleFunctionBlocks)
    setters.setForkSpirals([]) // Placeholder
    setters.setMapData([]) // Placeholder
    setters.setIsLoading(false)
    setters.setIsAnalyzing(false)
    setters.setActiveView("3d")
    setters.setSelectedNode(null)
    setters.setRunningBlock(null)
    setters.setExpandedBlocks([])
  }

  useEffect(() => {
    try {
      setIsMounted(true)

      const generateSampleData = () => {
        const sampleProcesses = [
          {
            address: "A1",
            command: "calculate_sum",
            category: "math",
            functionName: "add",
            code: "function add(a, b) {\n  return a + b;\n}",
          },
          {
            address: "A2",
            command: "if market_open",
            category: "control",
            is_fork: true,
            fork_type: "if",
            functionName: "checkMarket",
            code: "function checkMarket() {\n  // Check if market is open\n  return true;\n}",
          },
          {
            address: "A3",
            command: "fetch_data",
            category: "data",
            functionName: "getData",
            code: "async function getData() {\n  const response = await fetch('/api/data');\n  return await response.json();\n}",
          },
          {
            address: "A4",
            command: "process_results",
            category: "data",
            functionName: "processData",
            code: "function processData(data) {\n  // Process the fetched data\n  return processed;\n}",
          },
          {
            address: "A5",
            command: "save_output",
            category: "data",
            functionName: "saveOutput",
            code: "function saveOutput(output) {\n  console.log('Saving:', output);\n}",
          },
          {
            address: "A6",
            command: "for item in list",
            category: "control",
            is_fork: true,
            fork_type: "for",
            functionName: "loopItems",
            code: "function loopItems(list) {\n  list.forEach(item => console.log(item));\n}",
          },
          {
            address: "A7",
            command: "validate_input",
            category: "validation",
            functionName: "validateInput",
            code: "function validateInput(input) {\n  return input !== null && input !== undefined;\n}",
          },
          {
            address: "A8",
            command: "transform_data",
            category: "data",
            functionName: "transformData",
            code: "function transformData(data) {\n  // Transform data structure\n  return transformed;\n}",
          },
        ]

        const processedNodes = sampleProcesses.map((process, index) => {
          const angle = (index / sampleProcesses.length) * Math.PI * 5 // Increased turns
          const radius = 10 // Reduced radius for compactness
          const height = 25 - index * 3 // Reduced height spacing
          const smoothAngle = angle + Math.sin(angle * 2) * 0.3 // Add smoothing

          return {
            ...process,
            coords: [Math.cos(smoothAngle) * radius, height, Math.sin(smoothAngle) * radius] as [
              number,
              number,
              number,
            ],
            subprocesses: [],
            direction: null,
          }
        })

        setSpiralNodes(processedNodes)
        buildAddressRegistry(processedNodes)

        setMapData(
          sampleProcesses.map((p, i) => ({
            ...p,
            coords: processedNodes[i].coords,
            subprocesses: [],
            direction: null,
          })),
        )
        setIsLoading(false)
      }

      generateSampleData()
    } catch (error) {
      console.error("[v0] Error in mount effect:", error)
      setHasError(true)
    }
  }, [])

  useEffect(() => {
    if (spiralNodes && spiralNodes.length > 0) {
      buildAddressRegistry(spiralNodes)
    }
  }, [spiralNodes])

  if (hasError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
          <p className="text-gray-300 mb-4">Please refresh the page to try again.</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white font-mono">
      <header className="border-b border-primary/30 bg-gradient-to-r from-card via-card/90 to-card glass-effect">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                CodeMap Developer Platform
              </h1>
              <p className="text-muted-foreground">DNA-Based Development Environment with Function Library</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFileLoader(!showFileLoader)}
                className="bg-primary hover:bg-primary/80 neon-border"
              >
                {showFileLoader ? "Hide" : "Load Files"}
              </Button>
              <Button
                onClick={() => setShowLibrary(!showLibrary)}
                className="bg-secondary hover:bg-secondary/80 neon-border"
              >
                {showLibrary ? "Hide" : "Function Library"}
              </Button>
              <Button
                onClick={() => setShowTerminal(!showTerminal)}
                className="bg-accent hover:bg-accent/80 neon-border"
              >
                {showTerminal ? "Hide" : "Terminal"}
              </Button>
              <Button
                onClick={() => setActiveView(activeView === "3d" ? "2d" : "3d")}
                className="bg-chart-3 hover:bg-chart-3/80 neon-border"
              >
                {activeView === "3d" ? "2D View" : "3D View"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {showLibrary && (
        <div className="glass-effect border-b border-primary/30 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary">📚 Function Library</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search functions..."
                  value={searchQuery}
                  onChange={(e) => searchFunctions(e.target.value)}
                  className="px-3 py-1 bg-card border border-primary/30 rounded text-white neon-border"
                />
                <Button
                  onClick={() => {
                    const name = prompt("Function name:")
                    const description = prompt("Description:")
                    const code = prompt("Function code:")
                    const category = prompt("Category:")
                    if (name && description && code && category) {
                      addToLibrary(code, name, description, category)
                    }
                  }}
                  className="bg-secondary hover:bg-secondary/80 neon-border text-sm"
                >
                  Add Function
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {(searchQuery ? filteredFunctions : functionLibrary).map((func) => (
                <div key={func.id} className="bg-card rounded-lg p-4 border border-primary/30 neon-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{func.name}</h4>
                    <span className="text-xs bg-secondary px-2 py-1 rounded">{func.dnaAddress}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">{func.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{func.category}</span>
                    <span>Used: {func.usageCount}x</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button
                      onClick={() => addFunctionToProject(func)}
                      className="bg-primary hover:bg-primary/80 neon-border text-xs px-2 py-1"
                    >
                      Use in Project
                    </Button>
                    <Button
                      onClick={() => setSelectedFunction(func)}
                      className="bg-accent hover:bg-accent/80 neon-border text-xs px-2 py-1"
                    >
                      View Code
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showTerminal && (
        <div className="glass-effect border-b border-primary/30 p-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-lg font-semibold text-primary mb-4">🚀 Output Terminal</h3>

            <div className="bg-black rounded-lg p-4 font-mono text-sm neon-border">
              <div className="h-64 overflow-y-auto mb-4 space-y-1">
                {terminalOutput.map((output) => (
                  <div
                    key={output.id}
                    className={`
                    ${output.type === "input" ? "text-cyan-400" : ""}
                    ${output.type === "output" ? "text-primary" : ""}
                    ${output.type === "error" ? "text-destructive" : ""}
                    ${output.type === "system" ? "text-secondary" : ""}
                  `}
                  >
                    {output.content}
                  </div>
                ))}
              </div>

              <div className="flex items-center">
                <span className="text-primary mr-2 font-bold">{">"}</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      executeTerminalCommand(terminalInput)
                      setTerminalInput("")
                    }
                  }}
                  className="flex-1 bg-transparent text-white outline-none terminal-cursor"
                  placeholder="Enter command..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {currentProject && (
        <div className="glass-effect border-b border-primary/30 p-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-lg font-semibold text-secondary mb-2">📁 Current Project: {currentProject.name}</h3>
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">
                Functions Used: {Object.keys(currentProject.usedFunctions).length}
              </span>
              <span className="text-muted-foreground">
                DNA Addresses: {Object.keys(currentProject.usedFunctions).join(", ")}
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedFunction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto neon-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{selectedFunction.name}</h3>
              <Button onClick={() => setSelectedFunction(null)} className="bg-destructive hover:bg-destructive/80">
                Close
              </Button>
            </div>
            <pre className="bg-black p-4 rounded text-primary text-sm overflow-x-auto">{selectedFunction.code}</pre>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                <strong>Address:</strong> {selectedFunction.dnaAddress}
              </p>
              <p>
                <strong>Parameters:</strong> {selectedFunction.parameters.join(", ") || "None"}
              </p>
              <p>
                <strong>Category:</strong> {selectedFunction.category}
              </p>
              <p>
                <strong>Tags:</strong> {selectedFunction.tags.join(", ") || "None"}
              </p>
            </div>
          </div>
        </div>
      )}

      {showFileLoader && (
        <div className="glass-effect border-b border-primary/30 p-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-primary mb-4">📂 Advanced File Loader & System Analysis</h3>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/10" : "border-primary/30 hover:border-primary/50"
              }`}
              onDrop={(e) =>
                handleDrop(
                  e,
                  setIsAnalyzing,
                  setProjectAnalysis,
                  setSpiralNodes,
                  setFunctionBlocks,
                  setInputCode,
                  setLoadedFiles,
                  setDragActive,
                  setIsMounted,
                  setForkSpirals,
                  setMapData,
                  setIsLoading,
                  setShowFileLoader,
                  setActiveView,
                  setSelectedNode,
                  setRunningBlock,
                  setExpandedBlocks,
                )
              }
              onDragOver={(e) => handleDragOver(e, setDragActive)}
              onDragLeave={(e) => handleDragLeave(e, setDragActive)}
            >
              <div className="space-y-4">
                <div className="text-4xl">📂</div>
                <div>
                  <p className="text-lg font-medium text-white">Drop files here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports: .js, .ts, .jsx, .tsx, .py, .java, .cpp, .c, .cs, .php, .rb, .go, .rs, .swift, .kt, .zip,
                    .txt
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Load entire codebases to analyze energy consumption and optimization potential
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift,.kt,.zip,.txt"
                  onChange={(e) =>
                    handleFileUploadMultiple(
                      e,
                      setIsAnalyzing,
                      setProjectAnalysis,
                      setSpiralNodes,
                      setFunctionBlocks,
                      setInputCode,
                      setLoadedFiles,
                      setIsMounted,
                      setForkSpirals,
                      setMapData,
                      setIsLoading,
                      setShowFileLoader,
                      setActiveView,
                      setSelectedNode,
                      setRunningBlock,
                      setExpandedBlocks,
                    )
                  }
                  className="hidden"
                  id="file-upload-multiple"
                />
                <label
                  htmlFor="file-upload-multiple"
                  className="inline-block px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg cursor-pointer transition-colors font-medium neon-border"
                >
                  Select Files
                </label>
              </div>
            </div>

            {isAnalyzing && (
              <div className="mt-4 p-4 bg-primary/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-primary/70">Analyzing codebase for optimization opportunities...</span>
                </div>
              </div>
            )}

            {projectAnalysis && (
              <div className="mt-6 space-y-4">
                <div className="bg-card rounded-lg p-6 border border-primary/30 neon-border">
                  <h4 className="text-xl font-bold text-primary mb-4">🌍 Global Impact Analysis</h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-primary/20 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-white">{projectAnalysis.totalFiles}</div>
                      <div className="text-sm text-primary/70">Files Analyzed</div>
                    </div>
                    <div className="bg-secondary/20 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-white">{projectAnalysis.totalLines.toLocaleString()}</div>
                      <div className="text-sm text-secondary/70">Total Lines</div>
                    </div>
                    <div className="bg-destructive/20 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-white">
                        {projectAnalysis.totalDuplicates.toLocaleString()}
                      </div>
                      <div className="text-sm text-destructive/70">Duplicate Lines</div>
                    </div>
                    <div className="bg-green-600/20 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-white">
                        {projectAnalysis.overallEnergySavings.toFixed(1)}%
                      </div>
                      <div className="text-sm text-green-400">Energy Savings</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 p-4 rounded-lg mb-4">
                    <h5 className="font-bold text-white mb-2">🔋 Environmental Impact</h5>
                    <p className="text-sm text-gray-200">
                      By eliminating {projectAnalysis.totalDuplicates.toLocaleString()} duplicate lines, this
                      optimization could reduce CPU cycles by approximately{" "}
                      <span className="font-bold text-green-300">
                        {(projectAnalysis.overallEnergySavings * 1000).toFixed(0)}
                      </span>{" "}
                      million operations, potentially saving{" "}
                      <span className="font-bold text-blue-300">
                        {(projectAnalysis.overallEnergySavings * 0.1).toFixed(2)} kWh
                      </span>{" "}
                      of energy per execution cycle.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-semibold text-white">📊 File Analysis Breakdown</h5>
                    {projectAnalysis.fileAnalyses.map((analysis, index) => (
                      <div key={index} className="bg-card p-3 rounded border border-primary/30">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-mono text-sm text-white">{analysis.fileName}</span>
                            <span className="ml-2 px-2 py-1 bg-secondary text-xs rounded text-white">
                              {analysis.fileType}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-green-300 font-bold">
                              {analysis.energySavings.toFixed(1)}% savings
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {analysis.duplicateLines}/{analysis.totalLines} duplicates
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-300">
                          Optimization Potential:{" "}
                          <span className="text-yellow-300 font-bold">
                            {analysis.optimizationPotential.toFixed(1)}%
                          </span>
                          {analysis.functionBlocks > 0 && (
                            <span className="ml-4">
                              Functions: <span className="text-blue-300">{analysis.functionBlocks}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-120px)]">
        <div className="w-80 bg-card border-r border-primary/30 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-primary">Pipeline Control</h2>

            <div className="mb-4 p-3 bg-card rounded border border-primary/30">
              <h3 className="text-sm font-semibold mb-2 text-secondary">Active Summons</h3>
              {activeSummons.length > 0 ? (
                <div className="space-y-1">
                  {activeSummons.map((addr) => (
                    <div key={addr} className="text-xs text-secondary font-bold animate-pulse">
                      🔄 Summoning {addr.toUpperCase()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Pipeline idle</div>
              )}
            </div>

            <div className="mb-4 p-3 bg-card rounded border border-primary/30">
              <h3 className="text-sm font-semibold mb-2 text-secondary">Recent Calls</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {pipelineCalls
                  .slice(-5)
                  .reverse()
                  .map((call, idx) => (
                    <div key={idx} className="text-xs flex justify-between">
                      <span className="text-muted-foreground">
                        {call.addressId?.toUpperCase() || call.toAddress?.toUpperCase()}
                      </span>
                      <span
                        className={`font-medium ${
                          call.status === "completed"
                            ? "text-green-400"
                            : call.status === "executing"
                              ? "text-yellow-400"
                              : call.status === "failed"
                                ? "text-destructive"
                                : call.status === "summoning"
                                  ? "text-secondary"
                                  : "text-muted-foreground"
                        }`}
                      >
                        {call.status === "completed"
                          ? "✓"
                          : call.status === "executing"
                            ? "⚡"
                            : call.status === "failed"
                              ? "✗"
                              : call.status === "summoning"
                                ? "🔮"
                                : "⏳"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2 text-secondary">Function Blocks</h3>
            {functionBlocks.map((block) => (
              <div key={block.id} className="mb-4 p-3 bg-card rounded border border-primary/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm text-white">{block.name}</span>
                  <Button
                    onClick={() => runFromHere(block.startAddress)}
                    className="bg-primary hover:bg-primary/80 neon-border text-xs"
                    disabled={!!runningBlock || activeSummons.length > 0}
                  >
                    Summon Block
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground mb-2">
                  <div className="font-semibold text-secondary">
                    {block.id.toUpperCase()} consists of lines: {block.lineComposition.join(" ")}
                  </div>

                  <div className="mt-1 text-gray-400">
                    Original: {block.originalLines.join(" ")} ({block.originalLines.length} lines)
                  </div>
                  <div className="text-green-400">
                    Optimized: {block.optimizedLines.join(" ")} ({block.optimizedLines.length} lines)
                  </div>

                  {Object.keys(block.duplicateReplacements).length > 0 && (
                    <div className="mt-1 text-yellow-400 text-xs">
                      Duplicates replaced:{" "}
                      {Object.entries(block.duplicateReplacements)
                        .map(([duplicate, original]) => `${duplicate}→${original}`)
                        .join(", ")}
                    </div>
                  )}

                  <div className="text-teal-400 font-medium">
                    Efficiency: {Math.round((1 - block.optimizedLines.length / block.originalLines.length) * 100)}%
                    reduction
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  A{block.startAddress + 1} - A{block.endAddress + 1} ({block.addresses.length} processes)
                </div>
              </div>
            ))}

            <div className="space-y-2">
              {spiralNodes.map((node, index) => {
                const containingBlock = functionBlocks.find((block) => block.addresses.includes(index))
                const lineRef = `a${index + 1}`
                const isOptimizedOut = containingBlock?.duplicateReplacements[lineRef]
                const isBeingSummoned = activeSummons.includes(lineRef)

                return (
                  <div
                    key={index}
                    className={`p-3 rounded cursor-pointer transition-all border ${
                      isBeingSummoned
                        ? "bg-secondary border-secondary animate-pulse text-white"
                        : selectedNode?.index === node.index
                          ? "bg-yellow-400 border-yellow-400 text-black"
                          : currentExecutingLine === index
                            ? "bg-primary border-primary animate-pulse text-white"
                            : isOptimizedOut
                              ? "bg-indigo-900 border-indigo-600 hover:bg-indigo-800 text-white"
                              : node.isDuplicate
                                ? "bg-destructive/70 border-destructive hover:bg-destructive/50 text-white"
                                : node.duplicateCount > 1
                                  ? "bg-teal-900 border-teal-600 hover:bg-teal-800 text-white"
                                  : "bg-card border-primary/30 hover:bg-card/50 text-white"
                    }`}
                    onClick={() => handleAddressClick(node, index)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold">
                          A{index + 1} ({lineRef})
                        </span>
                        {isBeingSummoned && (
                          <span className="text-xs text-secondary font-bold animate-pulse">🔮 SUMMONED</span>
                        )}
                        <span
                          className={`px-2 py-1 rounded text-xs text-white font-medium ${getCategoryColor(node.category || "general")}`}
                        >
                          {node.category}
                        </span>
                        {node.duplicateCount > 1 && (
                          <span className="text-xs text-teal-200 font-bold">×{node.duplicateCount}</span>
                        )}
                        {node.isDuplicate && (
                          <span className="text-xs text-red-200 font-bold">→A{(node.referenceTo || 0) + 1}</span>
                        )}
                        {isOptimizedOut && <span className="text-xs text-indigo-200 font-bold">→{isOptimizedOut}</span>}
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          summonAddress(lineRef)
                        }}
                        className="bg-secondary hover:bg-secondary/80 neon-border text-xs"
                        disabled={!!runningBlock || activeSummons.length > 0}
                      >
                        Summon
                      </Button>
                    </div>
                    <div className="text-xs text-gray-200 mt-1 truncate font-mono">{node.command}</div>

                    {containingBlock && (
                      <div className="text-xs text-blue-200 mt-1">
                        In {containingBlock.id.toUpperCase()}: {containingBlock.lineComposition.join(" ")}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-gradient-to-br from-black via-gray-900 to-black">
          <div className="p-4 border-b border-primary/30 glass-effect">
            <h2 className="text-xl font-bold text-primary">🧬 DNA Visualizer</h2>
            <p className="text-muted-foreground">Explore the code structure in 3D or 2D</p>
          </div>

          <div className="flex-1 p-4 bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
            {activeView === "3d" && isMounted ? (
              <div className="w-full h-full neon-border rounded-lg overflow-hidden">
                <Canvas camera={{ position: [40, 25, 40], fov: 60 }}>
                  <ambientLight intensity={0.4} color="#6366f1" />
                  <pointLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
                  <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />
                  <DNASpiral
                    nodes={spiralNodes}
                    forkSpirals={forkSpirals}
                    selectedNode={selectedNode}
                    onNodeClick={setSelectedNode}
                    onAddressClick={handleAddressClick}
                    setSelectedFunctionCode={setSelectedFunctionCode}
                    setShowCodeModal={setShowCodeModal}
                  />
                  <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
                </Canvas>
              </div>
            ) : activeView === "2d" ? (
              <div className="w-full h-full neon-border rounded-lg overflow-hidden">
                <BirdsEyeView
                  nodes={spiralNodes}
                  selectedNode={selectedNode}
                  onNodeClick={setSelectedNode}
                  expandedBlocks={expandedBlocks}
                  runningBlock={runningBlock}
                  setSelectedFunctionCode={setSelectedFunctionCode}
                  setShowCodeModal={setShowCodeModal}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading 3D visualization...</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-1/3 glass-effect border-l border-primary/30">
          <div className="p-4 border-b border-primary/30 bg-gradient-to-r from-card/50 to-transparent">
            <h3 className="text-lg font-semibold text-secondary">🌪️ 2D Cyclone View</h3>
            {runningBlock && (
              <div className="text-sm text-primary mt-1 font-medium dna-pulse">Executing: {runningBlock.name}</div>
            )}
          </div>
          <BirdsEyeView
            nodes={spiralNodes}
            selectedNode={selectedNode}
            executingProcess={null}
            functionBlocks={functionBlocks}
            expandedBlocks={expandedBlocks}
            setSelectedFunctionCode={setSelectedFunctionCode}
            setShowCodeModal={setShowCodeModal}
          />
        </div>
      </div>

      <FunctionCodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        functionData={selectedFunctionCode}
      />

      <footer className="border-t border-primary/30 bg-gradient-to-r from-card via-card/90 to-card glass-effect">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-muted-foreground">
            CodeMap Developer Platform - DNA-Based Development Environment
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Page
