"use client"

import type React from "react"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

const Canvas = dynamic(() => import("@react-three/fiber").then((mod) => ({ default: mod.Canvas })), {
  ssr: false,
})
const OrbitControls = dynamic(() => import("@react-three/drei").then((mod) => ({ default: mod.OrbitControls })), {
  ssr: false,
})
const Text = dynamic(() => import("@react-three/drei").then((mod) => ({ default: mod.Text })), {
  ssr: false,
})
const Html = dynamic(() => import("@react-three/drei").then((mod) => ({ default: mod.Html })), {
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
  isDuplicate?: boolean
  referenceTo?: number
  duplicateCount?: number
  references?: number[]
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
  fromAddress: string
  toAddress: string
  timestamp: number
  status: "pending" | "executing" | "completed" | "failed"
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

function DNASpiral({ nodes, forkSpirals, selectedNode, onNodeClick, onAddressClick }: any) {
  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 25, 0, 0, -25, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00ff00" linewidth={4} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([2, 25, 0, 2, -25, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00ff00" linewidth={4} />
      </line>

      {nodes.map((node, index) => {
        const totalHeight = 50
        const heightStep = totalHeight / Math.max(nodes.length, 8)
        const yPos = 25 - index * heightStep * 2

        const spiralRadius = 12
        const spiralTurns = 2.5
        const angle = (index / nodes.length) * spiralTurns * 2 * Math.PI

        const xPos = spiralRadius * Math.cos(angle)
        const zPos = spiralRadius * Math.sin(angle)

        const nextIndex = index + 1
        if (nextIndex < nodes.length) {
          const nextYPos = 25 - nextIndex * heightStep * 2
          const nextAngle = (nextIndex / nodes.length) * spiralTurns * 2 * Math.PI
          const nextXPos = spiralRadius * Math.cos(nextAngle)
          const nextZPos = spiralRadius * Math.sin(nextAngle)

          return (
            <group key={`spiral-bridge-${index}`}>
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([xPos, yPos, zPos, nextXPos, nextYPos, nextZPos])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="white" linewidth={1} />
              </line>

              <mesh
                position={[xPos, yPos, zPos]}
                onClick={() => onNodeClick(node)}
                onPointerOver={(e) => e.stopPropagation()}
              >
                <sphereGeometry args={[1.2]} />
                <meshBasicMaterial
                  color={
                    node.isDuplicate
                      ? "#ff6b6b"
                      : selectedNode?.index === node.index
                        ? "#fbbf24"
                        : node.duplicateCount > 1
                          ? "#4ecdc4"
                          : "#ffffff"
                  }
                  transparent
                  opacity={0.9}
                />
              </mesh>

              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([xPos, yPos, zPos, 1, yPos, 0])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial
                  color={node.isDuplicate ? "#ff6b6b" : "#00ff00"}
                  linewidth={3}
                  opacity={selectedNode?.index === node.index ? 1.0 : 0.4}
                  transparent
                />
              </line>

              {Html && (
                <Html position={[xPos + 2, yPos + 1.5, zPos]}>
                  <div
                    className={`text-white text-sm font-mono px-2 py-1 rounded cursor-pointer transition-all ${
                      selectedNode?.index === node.index
                        ? "bg-yellow-600 border border-yellow-400"
                        : node.isDuplicate
                          ? "bg-red-600 bg-opacity-80 hover:bg-red-500"
                          : node.duplicateCount > 1
                            ? "bg-teal-600 bg-opacity-80 hover:bg-teal-500"
                            : "bg-black bg-opacity-70 hover:bg-gray-700"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddressClick?.(node, index)
                    }}
                  >
                    A{index + 1}
                    {node.duplicateCount > 1 && (
                      <span className="ml-1 text-xs text-teal-300">×{node.duplicateCount}</span>
                    )}
                    {node.isDuplicate && <span className="ml-1 text-xs text-red-300">→</span>}
                  </div>
                </Html>
              )}

              {selectedNode?.index === node.index && (
                <>
                  <mesh position={[xPos * 0.7, yPos, zPos * 0.7]}>
                    <sphereGeometry args={[0.4]} />
                    <meshBasicMaterial color="#00ff00" />
                  </mesh>
                  <mesh position={[xPos * 0.4, yPos, zPos * 0.4]}>
                    <sphereGeometry args={[0.3]} />
                    <meshBasicMaterial color="#00ff00" transparent opacity={0.7} />
                  </mesh>
                </>
              )}
            </group>
          )
        }
        return null
      })}

      {Array.from({ length: 12 }, (_, i) => {
        const yPos = 22 - i * 4
        return (
          <mesh key={`pipeline-flow-${i}`} position={[1, yPos, 0]}>
            <sphereGeometry args={[0.25]} />
            <meshBasicMaterial color="#00ff00" transparent opacity={selectedNode ? 0.9 - i * 0.05 : 0.3} />
          </mesh>
        )
      })}
    </group>
  )
}

function BirdsEyeView({ nodes, selectedNode, executingProcess, functionBlocks, expandedBlocks }: any) {
  return (
    <div className="w-full h-full bg-gray-900 relative overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 400 400" className="absolute inset-0">
        <line x1="200" y1="50" x2="200" y2="350" stroke="#00ff00" strokeWidth="4" />

        {functionBlocks.map((block: FunctionBlock, blockIndex: number) => {
          const isExpanded = expandedBlocks.includes(block.id)
          const cycloneRadius = isExpanded ? 80 + blockIndex * 10 : 40 + blockIndex * 5
          const centerY = 100 + blockIndex * 60

          return (
            <g key={block.id}>
              <circle
                cx="200"
                cy={centerY}
                r={cycloneRadius}
                fill="none"
                stroke={isExpanded ? "#00ff00" : "#666"}
                strokeWidth={isExpanded ? 3 : 1}
                strokeDasharray={isExpanded ? "5,5" : "2,2"}
                className={isExpanded ? "animate-spin" : ""}
                style={{ animationDuration: "4s" }}
              />

              {block.addresses.map((addressIndex, i) => {
                const node = nodes[addressIndex]
                if (!node) return null

                const subRadius = cycloneRadius * 0.3
                const angle = (i / block.addresses.length) * 2 * Math.PI
                const subX = 200 + cycloneRadius * 0.7 * Math.cos(angle)
                const subY = centerY + cycloneRadius * 0.7 * Math.sin(angle)

                return (
                  <g key={`sub-${addressIndex}`}>
                    <circle
                      cx={subX}
                      cy={subY}
                      r={subRadius}
                      fill="none"
                      stroke={node.isDuplicate ? "#ff6b6b" : "#4ecdc4"}
                      strokeWidth="1"
                      strokeDasharray="1,1"
                    />

                    <circle
                      cx={subX}
                      cy={subY}
                      r={selectedNode?.index === addressIndex ? 8 : 4}
                      fill={
                        executingProcess?.index === addressIndex
                          ? "#fbbf24"
                          : selectedNode?.index === addressIndex
                            ? "#00ff00"
                            : node.isDuplicate
                              ? "#ff6b6b"
                              : "#ffffff"
                      }
                      className={executingProcess?.index === addressIndex ? "animate-pulse" : ""}
                    />

                    <text x={subX} y={subY - 12} textAnchor="middle" className="text-xs fill-white font-mono">
                      A{addressIndex + 1}
                    </text>
                  </g>
                )
              })}

              <text x="200" y={centerY} textAnchor="middle" className="text-sm fill-white font-mono">
                {block.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function parseCodeToProcesses(code: string): ProcessNode[] {
  const lines = code.split("\n").filter((line) => line.trim())
  const processes: ProcessNode[] = []

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    let category = "general"
    let fork_type: "if" | "else" | "loop" | "function_call" | "merge" | undefined
    let is_fork = false

    if (trimmed.includes("def ") || trimmed.includes("function ")) {
      category = "function"
      fork_type = "function_call"
      is_fork = true
    } else if (trimmed.includes("if ") || trimmed.includes("if(")) {
      category = "control"
      fork_type = "if"
      is_fork = true
    } else if (trimmed.includes("else")) {
      category = "control"
      fork_type = "else"
      is_fork = true
    } else if (trimmed.includes("for ") || trimmed.includes("while ")) {
      category = "control"
      fork_type = "loop"
      is_fork = true
    } else if (trimmed.includes("return") || trimmed.includes("merge")) {
      category = "control"
      fork_type = "merge"
      is_fork = true
    } else if (trimmed.includes("calculate") || trimmed.includes("compute")) {
      category = "math"
    } else if (trimmed.includes("data") || trimmed.includes("fetch")) {
      category = "data"
    }

    const totalHeight = 50
    const heightStep = totalHeight / lines.length
    const yPos = 25 - index * heightStep

    const spiralRadius = 8 + Math.sin(index * 0.3) * 2
    const spiralTurns = 4
    const angle = (index / lines.length) * spiralTurns * 2 * Math.PI

    let strandOffset = 0
    if (category === "control") strandOffset = Math.PI * 0.5
    else if (category === "math" || category === "analysis") strandOffset = Math.PI
    else if (category === "function") strandOffset = Math.PI * 1.5

    const xPos = spiralRadius * Math.cos(angle + strandOffset)
    const zPos = spiralRadius * Math.sin(angle + strandOffset)

    const bases = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
    const base_char = bases[index % bases.length]

    processes.push({
      index,
      coords: [xPos, yPos, zPos] as [number, number, number],
      strand: index % 2,
      base: base_char,
      complement: bases[bases.length - 1 - (index % bases.length)],
      angle: angle + strandOffset,
      base_pair_id: `${base_char}-${bases[bases.length - 1 - (index % bases.length)]}`,
      command: trimmed,
      category,
      is_fork,
      fork_type,
      spiral_id: "main",
    })
  })

  return processes
}

function generateForkSpirals(nodes: ProcessNode[]): ForkSpiral[] {
  return []
}

const handleZipFile = async (
  file: File,
  setIsAnalyzing: any,
  setProjectAnalysis: any,
  setSpiralNodes: any,
  setFunctionBlocks: any,
  setInputCode: any,
  setLoadedFiles: any,
  setDragActive: any,
  setIsMounted: any,
  setForkSpirals: any,
  setMapData: any,
  setIsLoading: any,
  setShowFileLoader: any,
  setActiveView: any,
  setSelectedNode: any,
  setRunningBlock: any,
  setExpandedBlocks: any,
) => {
  setIsAnalyzing(true)

  try {
    // Import JSZip dynamically to avoid bundle bloat
    const JSZip = (await import("jszip")).default
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(file)

    const files: File[] = []
    const batchSize = 10 // Process files in batches to avoid overwhelming the system

    // Extract files from zip
    for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
      if (!zipEntry.dir && isCodeFile(filename)) {
        const content = await zipEntry.async("text")
        const blob = new Blob([content], { type: "text/plain" })
        const extractedFile = new File([blob], filename, { type: "text/plain" })
        files.push(extractedFile)
      }
    }

    console.log(`[v0] Extracted ${files.length} code files from zip`)

    // Process files in batches to reduce operations
    const batches = []
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize))
    }

    console.log(`[v0] Processing ${batches.length} batches of files`)

    // Process batches sequentially to avoid overwhelming the system
    for (let i = 0; i < batches.length; i++) {
      console.log(`[v0] Processing batch ${i + 1}/${batches.length}`)
      await processMultipleFiles(
        batches[i],
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

      // Add small delay between batches to prevent UI freezing
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  } catch (error) {
    console.error("[v0] Error processing zip file:", error)
  } finally {
    setIsAnalyzing(false)
  }
}

const isCodeFile = (filename: string): boolean => {
  const codeExtensions = [
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".cs",
    ".php",
    ".rb",
    ".go",
    ".rs",
    ".swift",
    ".kt",
  ]
  return codeExtensions.some((ext) => filename.toLowerCase().endsWith(ext))
}

function handleFileUpload(
  event: React.ChangeEvent<HTMLInputElement>,
  setIsAnalyzing: any,
  setProjectAnalysis: any,
  setSpiralNodes: any,
  setFunctionBlocks: any,
  setInputCode: any,
  setLoadedFiles: any,
  setDragActive: any,
  setIsMounted: any,
  setForkSpirals: any,
  setMapData: any,
  setIsLoading: any,
  setShowFileLoader: any,
  setActiveView: any,
  setSelectedNode: any,
  setRunningBlock: any,
  setExpandedBlocks: any,
) {
  const file = event.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const code = e.target?.result as string
      console.log(code)
      processMultipleFiles(
        [file],
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
    reader.readAsText(file)
  }
}

const processMultipleFiles = async (
  files: File[],
  setIsAnalyzing: any,
  setProjectAnalysis: any,
  setSpiralNodes: any,
  setFunctionBlocks: any,
  setInputCode: any,
  setLoadedFiles: any,
  setDragActive: any,
  setIsMounted: any,
  setForkSpirals: any,
  setMapData: any,
  setIsLoading: any,
  setShowFileLoader: any,
  setActiveView: any,
  setSelectedNode: any,
  setRunningBlock: any,
  setExpandedBlocks: any,
) => {
  if (files.length === 0) return

  setIsAnalyzing(true)
  const fileAnalyses: FileAnalysis[] = []
  const globalCodeMap = new Map<string, string[]>()
  let totalLines = 0
  let totalDuplicates = 0

  // Batch read all files first
  const fileContents = await Promise.all(
    files.map(async (file) => ({
      file,
      content: await readFileContent(file),
    })),
  )

  // Then analyze all at once instead of one by one
  fileContents.forEach(({ file, content }) => {
    const analysis = analyzeFile(file.name, content, globalCodeMap)
    fileAnalyses.push(analysis)
    totalLines += analysis.totalLines
    totalDuplicates += analysis.duplicateLines
  })

  const overallEnergySavings = totalDuplicates > 0 ? (totalDuplicates / totalLines) * 100 : 0
  const optimizationPotential = calculateOptimizationPotential(fileAnalyses)

  const projectAnalysis: ProjectAnalysis = {
    totalFiles: files.length,
    totalLines,
    totalDuplicates,
    overallEnergySavings,
    optimizationPotential,
    fileAnalyses,
    globalDuplicates: Object.fromEntries(
      Array.from(globalCodeMap.entries()).filter(([_, locations]) => locations.length > 1),
    ),
  }

  setProjectAnalysis(projectAnalysis)
  setIsAnalyzing(false)

  // Process the first file for visualization
  if (files.length > 0) {
    const firstFileContent = await readFileContent(files[0])
    const processes = parseCodeToProcesses(firstFileContent)
    const processedNodes = detectCodeDuplicates(processes)
    const blocks = detectFunctionBlocks(processedNodes)

    setSpiralNodes(processedNodes)
    setFunctionBlocks(blocks)
    setInputCode(firstFileContent)
  }
}

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.readAsText(file)
  })
}

const analyzeFile = (fileName: string, content: string, globalCodeMap: Map<string, string[]>): FileAnalysis => {
  const lines = content.split("\n").filter((line) => line.trim())
  const lineMap = new Map<string, number>()
  const categories: { [key: string]: number } = {}

  lines.forEach((line, index) => {
    const normalized = line.trim().toLowerCase()
    if (normalized) {
      // Track global duplicates across all files
      if (!globalCodeMap.has(normalized)) {
        globalCodeMap.set(normalized, [])
      }
      globalCodeMap.get(normalized)!.push(`${fileName}:${index + 1}`)

      // Track local duplicates
      lineMap.set(normalized, (lineMap.get(normalized) || 0) + 1)

      // Categorize lines
      const category = categorizeCodeLine(line)
      categories[category] = (categories[category] || 0) + 1
    }
  })

  const duplicateLines = Array.from(lineMap.values()).reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0)
  const uniqueLines = lines.length - duplicateLines
  const energySavings = duplicateLines > 0 ? (duplicateLines / lines.length) * 100 : 0
  const optimizationPotential = calculateFileOptimization(categories, duplicateLines, lines.length)

  return {
    fileName,
    fileType: getFileType(fileName),
    totalLines: lines.length,
    duplicateLines,
    uniqueLines,
    energySavings,
    optimizationPotential,
    functionBlocks: categories["function"] || 0,
    categories,
  }
}

const categorizeCodeLine = (line: string): string => {
  const trimmed = line.trim().toLowerCase()
  if (trimmed.includes("def ") || trimmed.includes("function ") || trimmed.includes("class ")) return "function"
  if (trimmed.includes("if ") || trimmed.includes("else") || trimmed.includes("switch")) return "control"
  if (trimmed.includes("for ") || trimmed.includes("while ") || trimmed.includes("do ")) return "loop"
  if (trimmed.includes("import ") || trimmed.includes("require(") || trimmed.includes("#include")) return "import"
  if (trimmed.includes("return ") || trimmed.includes("yield ")) return "return"
  if (trimmed.includes("try ") || trimmed.includes("catch ") || trimmed.includes("except")) return "error_handling"
  if (trimmed.includes("console.log") || trimmed.includes("print(") || trimmed.includes("echo")) return "debug"
  if (trimmed.includes("//") || trimmed.includes("#") || trimmed.includes("/*")) return "comment"
  return "general"
}

const getFileType = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase()
  const typeMap: { [key: string]: string } = {
    js: "JavaScript",
    ts: "TypeScript",
    jsx: "React JSX",
    tsx: "React TSX",
    py: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    cs: "C#",
    php: "PHP",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    swift: "Swift",
    kt: "Kotlin",
  }
  return typeMap[extension || ""] || "Unknown"
}

const calculateFileOptimization = (
  categories: { [key: string]: number },
  duplicates: number,
  total: number,
): number => {
  const functionWeight = (categories["function"] || 0) * 0.3
  const controlWeight = (categories["control"] || 0) * 0.2
  const duplicateWeight = (duplicates / total) * 0.5
  return Math.min(100, (functionWeight + controlWeight + duplicateWeight) * 100)
}

const calculateOptimizationPotential = (analyses: FileAnalysis[]): number => {
  const totalPotential = analyses.reduce((sum, analysis) => sum + analysis.optimizationPotential, 0)
  return analyses.length > 0 ? totalPotential / analyses.length : 0
}

const handleFileUploadMultiple = async (
  event: React.ChangeEvent<HTMLInputElement>,
  setIsAnalyzing: any,
  setProjectAnalysis: any,
  setSpiralNodes: any,
  setFunctionBlocks: any,
  setInputCode: any,
  setLoadedFiles: any,
  setDragActive: any,
  setIsMounted: any,
  setForkSpirals: any,
  setMapData: any,
  setIsLoading: any,
  setShowFileLoader: any,
  setActiveView: any,
  setSelectedNode: any,
  setRunningBlock: any,
  setExpandedBlocks: any,
) => {
  const files = Array.from(event.target.files || [])
  if (files.length === 0) return

  const firstFile = files[0]

  // Check if it's a zip file
  if (firstFile.name.toLowerCase().endsWith(".zip")) {
    console.log("[v0] Detected zip file, processing...")
    await handleZipFile(
      firstFile,
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
  } else {
    console.log(`[v0] Processing ${files.length} individual files`)
    setLoadedFiles(files)
    await processMultipleFiles(
      files,
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
}

const handleDrop = async (
  e: React.DragEvent,
  setIsAnalyzing: any,
  setProjectAnalysis: any,
  setSpiralNodes: any,
  setFunctionBlocks: any,
  setInputCode: any,
  setLoadedFiles: any,
  setDragActive: any,
  setIsMounted: any,
  setForkSpirals: any,
  setMapData: any,
  setIsLoading: any,
  setShowFileLoader: any,
  setActiveView: any,
  setSelectedNode: any,
  setRunningBlock: any,
  setExpandedBlocks: any,
) => {
  e.preventDefault()
  setDragActive(false)
  const files = Array.from(e.dataTransfer.files)
  if (files.length === 0) return

  const firstFile = files[0]

  if (firstFile.name.toLowerCase().endsWith(".zip")) {
    console.log("[v0] Detected zip file via drag and drop, processing...")
    await handleZipFile(
      firstFile,
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
  } else {
    console.log(`[v0] Processing ${files.length} dragged files`)
    setLoadedFiles(files)
    await processMultipleFiles(
      files,
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
}

const handleDragOver = (e: React.DragEvent, setDragActive: any) => {
  e.preventDefault()
  setDragActive(true)
}

const handleDragLeave = (e: React.DragEvent, setDragActive: any) => {
  e.preventDefault()
  setDragActive(false)
}

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

  const [addressRegistry, setAddressRegistry] = useState<AddressRegistry>({})
  const [pipelineCalls, setPipelineCalls] = useState<PipelineCall[]>([])
  const [activeSummons, setActiveSummons] = useState<string[]>([])

  const handleAddressClick = (node: ProcessNode, index: number) => {
    setSelectedNode(node)
    setCurrentExecutingLine(index)
  }

  const summonAddress = async (addressId: string, callingAddress?: string) => {
    const registryEntry = addressRegistry[addressId]
    if (!registryEntry) {
      console.log(`[v0] Address ${addressId} not found in registry`)
      return null
    }

    // Create pipeline call record
    const call: PipelineCall = {
      fromAddress: callingAddress || "pipeline",
      toAddress: addressId,
      timestamp: Date.now(),
      status: "pending",
    }

    setPipelineCalls((prev) => [...prev, call])
    setActiveSummons((prev) => [...prev, addressId])

    try {
      // Update call status
      setPipelineCalls((prev) => prev.map((c) => (c.timestamp === call.timestamp ? { ...c, status: "executing" } : c)))

      // Execute the summoned address
      const result = await registryEntry.executionFunction()

      // Mark as completed
      setPipelineCalls((prev) => prev.map((c) => (c.timestamp === call.timestamp ? { ...c, status: "completed" } : c)))

      return result
    } catch (error) {
      // Mark as failed
      setPipelineCalls((prev) => prev.map((c) => (c.timestamp === call.timestamp ? { ...c, status: "failed" } : c)))
      console.error(`[v0] Failed to execute ${addressId}:`, error)
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
        await summonAddress(addr, "pipeline")
        // Small delay between summons for visual effect
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      setRunningBlock(null)
    } else {
      // Summon single address
      await summonAddress(addressId, "pipeline")
    }
  }

  useEffect(() => {
    if (spiralNodes.length > 0) {
      buildAddressRegistry(spiralNodes)
    }
  }, [spiralNodes])

  useEffect(() => {
    setIsMounted(true)

    const generateSampleData = () => {
      const sampleProcesses = [
        { address: "A1", command: "calculate_sum", category: "math" },
        { address: "A2", command: "if market_open", category: "control", is_fork: true, fork_type: "if" },
        { address: "A3", command: "allocate_pyramid", category: "function" },
        { address: "A4", command: "calculate_cr", category: "math" },
        { address: "A5", command: "calculate_sum", category: "math" },
        { address: "A6", command: "calculate_moving_averages", category: "analysis" },
        { address: "A7", command: "for each_stock", category: "control", is_fork: true, fork_type: "loop" },
        { address: "A8", command: "detect_market_sentiment", category: "function" },
        { address: "A9", command: "execute_trades", category: "function" },
        { address: "A10", command: "if market_open", category: "control", is_fork: true, fork_type: "if" },
        { address: "A11", command: "validate_data", category: "function" },
        { address: "A12", command: "process_results", category: "analysis" },
        { address: "A13", command: "while running", category: "control", is_fork: true, fork_type: "loop" },
        { address: "A14", command: "compute_metrics", category: "math" },
        { address: "A15", command: "store_output", category: "function" },
      ]

      const nodes: ProcessNode[] = sampleProcesses.map((process, i) => {
        const totalHeight = 50
        const heightStep = totalHeight / sampleProcesses.length
        const yPos = 25 - i * heightStep

        const spiralRadius = 8 + Math.sin(i * 0.3) * 2
        const spiralTurns = 4
        const angle = (i / sampleProcesses.length) * spiralTurns * 2 * Math.PI

        let strandOffset = 0
        if (process.category === "control") strandOffset = Math.PI * 0.5
        else if (process.category === "math" || process.category === "analysis") strandOffset = Math.PI
        else if (process.category === "function") strandOffset = Math.PI * 1.5

        const xPos = spiralRadius * Math.cos(angle + strandOffset)
        const zPos = spiralRadius * Math.sin(angle + strandOffset)

        const bases = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
        const base_char = bases[i % bases.length]

        return {
          index: i,
          coords: [xPos, yPos, zPos] as [number, number, number],
          strand: i % 2,
          base: base_char,
          complement: bases[bases.length - 1 - (i % bases.length)],
          angle: angle + strandOffset,
          base_pair_id: `${base_char}-${bases[bases.length - 1 - (i % bases.length)]}`,
          command: process.command,
          category: process.category,
          is_fork: process.is_fork,
          fork_type: process.fork_type as any,
          spiral_id: "main",
        }
      })

      const processedNodes = detectCodeDuplicates(nodes)
      const blocks = detectFunctionBlocks(processedNodes)
      const forks = generateForkSpirals(processedNodes)

      setSpiralNodes(processedNodes)
      setFunctionBlocks(blocks)
      setForkSpirals(forks)
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
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-700 bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">CodeMap DNA Spiral</h1>
              <p className="text-gray-300">Base-44 Process Visualization with Energy Optimization Analysis</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFileLoader(!showFileLoader)}
                className="bg-purple-600 hover:bg-purple-500 text-white border-purple-500"
              >
                📁 Load Files
              </Button>
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

      {showFileLoader && (
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-green-400 mb-4">Advanced File Loader & System Analysis</h3>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-green-400 bg-green-900 bg-opacity-20" : "border-gray-600 hover:border-gray-500"
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
                  <p className="text-sm text-gray-400 mt-2">
                    Supports: .js, .ts, .jsx, .tsx, .py, .java, .cpp, .c, .cs, .php, .rb, .go, .rs, .swift, .kt, .zip
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
                  className="hidden"
                  id="file-upload-multiple"
                />
                <label
                  htmlFor="file-upload-multiple"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer transition-colors font-medium"
                >
                  Select Files
                </label>
              </div>
            </div>

            {isAnalyzing && (
              <div className="mt-4 p-4 bg-blue-900 bg-opacity-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span className="text-blue-300">Analyzing codebase for optimization opportunities...</span>
                </div>
              </div>
            )}

            {projectAnalysis && (
              <div className="mt-6 space-y-4">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-600">
                  <h4 className="text-xl font-bold text-green-400 mb-4">🌍 Global Impact Analysis</h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-800 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-white">{projectAnalysis.totalFiles}</div>
                      <div className="text-sm text-blue-200">Files Analyzed</div>
                    </div>
                    <div className="bg-purple-800 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-white">{projectAnalysis.totalLines.toLocaleString()}</div>
                      <div className="text-sm text-purple-200">Total Lines</div>
                    </div>
                    <div className="bg-red-800 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-white">
                        {projectAnalysis.totalDuplicates.toLocaleString()}
                      </div>
                      <div className="text-sm text-red-200">Duplicate Lines</div>
                    </div>
                    <div className="bg-green-800 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-white">
                        {projectAnalysis.overallEnergySavings.toFixed(1)}%
                      </div>
                      <div className="text-sm text-green-200">Energy Savings</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-900 to-blue-900 p-4 rounded-lg mb-4">
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
                      <div key={index} className="bg-gray-800 p-3 rounded border border-gray-600">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-mono text-sm text-white">{analysis.fileName}</span>
                            <span className="ml-2 px-2 py-1 bg-blue-600 text-xs rounded text-white">
                              {analysis.fileType}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-green-300 font-bold">
                              {analysis.energySavings.toFixed(1)}% savings
                            </div>
                            <div className="text-xs text-gray-400">
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

      <div className="flex h-screen bg-black">
        <div className="w-80 bg-gray-900 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-green-400">Pipeline Control</h2>

            <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
              <h3 className="text-sm font-semibold mb-2 text-blue-400">Active Summons</h3>
              {activeSummons.length > 0 ? (
                <div className="space-y-1">
                  {activeSummons.map((addr) => (
                    <div key={addr} className="text-xs text-green-300 animate-pulse">
                      🔄 Summoning {addr.toUpperCase()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400">Pipeline idle</div>
              )}
            </div>

            <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
              <h3 className="text-sm font-semibold mb-2 text-blue-400">Recent Calls</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {pipelineCalls
                  .slice(-5)
                  .reverse()
                  .map((call, idx) => (
                    <div key={idx} className="text-xs flex justify-between">
                      <span className="text-gray-300">{call.toAddress.toUpperCase()}</span>
                      <span
                        className={`font-medium ${
                          call.status === "completed"
                            ? "text-green-400"
                            : call.status === "executing"
                              ? "text-yellow-400"
                              : call.status === "failed"
                                ? "text-red-400"
                                : "text-gray-400"
                        }`}
                      >
                        {call.status === "completed"
                          ? "✓"
                          : call.status === "executing"
                            ? "⚡"
                            : call.status === "failed"
                              ? "✗"
                              : "⏳"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2 text-blue-400">Function Blocks</h3>
            {functionBlocks.map((block) => (
              <div key={block.id} className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm text-white">{block.name}</span>
                  <button
                    onClick={() => runFromHere(block.startAddress)}
                    className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors font-medium"
                    disabled={!!runningBlock || activeSummons.length > 0}
                  >
                    Summon Block
                  </button>
                </div>

                <div className="text-xs text-gray-300 mb-2">
                  <div className="font-semibold text-blue-300">
                    {block.id.toUpperCase()} consists of lines: {block.lineComposition.join(" ")}
                  </div>

                  <div className="mt-1 text-gray-400">
                    Original: {block.originalLines.join(" ")} ({block.originalLines.length} lines)
                  </div>
                  <div className="text-green-300">
                    Optimized: {block.optimizedLines.join(" ")} ({block.optimizedLines.length} lines)
                  </div>

                  {Object.keys(block.duplicateReplacements).length > 0 && (
                    <div className="mt-1 text-yellow-300 text-xs">
                      Duplicates replaced:{" "}
                      {Object.entries(block.duplicateReplacements)
                        .map(([duplicate, original]) => `${duplicate}→${original}`)
                        .join(", ")}
                    </div>
                  )}

                  <div className="text-teal-300 font-medium">
                    Efficiency: {Math.round((1 - block.optimizedLines.length / block.originalLines.length) * 100)}%
                    reduction
                  </div>
                </div>

                <div className="text-xs text-gray-300">
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
                        ? "bg-purple-600 border-purple-400 animate-pulse text-white"
                        : selectedNode?.index === node.index
                          ? "bg-yellow-600 border-yellow-400 text-black"
                          : currentExecutingLine === index
                            ? "bg-green-600 border-green-400 animate-pulse text-white"
                            : isOptimizedOut
                              ? "bg-orange-900 border-orange-600 hover:bg-orange-800 text-white"
                              : node.isDuplicate
                                ? "bg-red-900 border-red-600 hover:bg-red-800 text-white"
                                : node.duplicateCount > 1
                                  ? "bg-teal-900 border-teal-600 hover:bg-teal-800 text-white"
                                  : "bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
                    }`}
                    onClick={() => handleAddressClick(node, index)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold">
                          A{index + 1} ({lineRef})
                        </span>
                        {isBeingSummoned && (
                          <span className="text-xs text-purple-200 font-bold animate-pulse">🔮 SUMMONED</span>
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
                        {isOptimizedOut && <span className="text-xs text-orange-200 font-bold">→{isOptimizedOut}</span>}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          summonAddress(lineRef)
                        }}
                        className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors font-medium"
                        disabled={!!runningBlock || activeSummons.length > 0}
                      >
                        Summon
                      </button>
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

        <div className="flex-1 flex flex-col bg-black">
          <div className="p-4 border-b border-gray-700 bg-gray-900">
            <h2 className="text-xl font-bold text-green-400">DNA Visualizer</h2>
            <p className="text-gray-300">Explore the code structure in 3D or 2D</p>
          </div>

          <div className="flex-1 p-4 bg-black">
            {activeView === "3d"
              ? isMounted && (
                  <Canvas camera={{ position: [40, 25, 40], fov: 60 }}>
                    <ambientLight intensity={0.6} />
                    <pointLight position={[10, 10, 10]} />
                    <DNASpiral
                      nodes={spiralNodes}
                      forkSpirals={forkSpirals}
                      selectedNode={selectedNode}
                      onNodeClick={setSelectedNode}
                      onAddressClick={handleAddressClick}
                    />
                    <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
                  </Canvas>
                )
              : null}
          </div>
        </div>

        <div className="w-1/3 bg-gray-800 border-l border-gray-700">
          <div className="p-4 border-b border-gray-700 bg-gray-900">
            <h3 className="text-lg font-semibold text-blue-400">2D Cyclone View</h3>
            {runningBlock && (
              <div className="text-sm text-green-300 mt-1 font-medium">Executing: {runningBlock.name}</div>
            )}
          </div>
          <BirdsEyeView
            nodes={spiralNodes}
            selectedNode={selectedNode}
            executingProcess={null}
            functionBlocks={functionBlocks}
            expandedBlocks={expandedBlocks}
          />
        </div>
      </div>

      <footer className="border-t border-gray-700 bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-gray-300">CodeMap DNA Spiral - Base-44 Process Visualization</p>
        </div>
      </footer>
    </div>
  )
}

export default Page
