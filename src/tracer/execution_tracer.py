# src/tracer/execution_tracer.py
import sys
from collections import defaultdict

class ExecutionTracer:
    def __init__(self):
        self.execution_map = defaultdict(list)
        self.current_coords = [0, 0, 0]  # x, y, z for 3D map

    def trace(self, frame, event, arg):
        """Trace execution and assign 3D coordinates."""
        if event == "line":
            code = frame.f_code
            line_no = frame.f_lineno
            address = f"A{line_no}"  # Simplified address for now
            self.current_coords[0] += 2  # Move along x-axis for sequential lines
            self.execution_map[address].append({
                'file': code.co_filename,
                'code': f"Line {line_no}",  # Placeholder; integrate with parser later
                'coords': self.current_coords.copy()
            })
        return self.trace

    def start_tracing(self, func):
        """Start tracing a function's execution."""
        sys.settrace(self.trace)
        func()
        sys.settrace(None)
        return self.execution_map
