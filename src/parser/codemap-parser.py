# src/parser/codemap-parser.py
import re
from collections import defaultdict

class CodeMapParser:
    def __init__(self):
        self.workflow = defaultdict(dict)
        self.directions = {
            '^': 'up', 'v': 'down', '<': 'left', '>': 'right',
            '^/': 'up-forward', 'v/': 'down-forward', 'v\\': 'down-backward', '^\\': 'up-backward'
        }

    def parse_file(self, file_path):
        """Parse a CodeMapping file and build workflow structure."""
        with open(file_path, 'r') as f:
            lines = f.readlines()

        current_address = None
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            # Match address and command (e.g., A1: print("Start") or A1^: def preprocess():)
            match = re.match(r'([A-Za-z0-9]+)([\^v<>\\/]*)?:\s*(.+)', line)
            if match:
                address, direction, command = match.groups()
                self.workflow[address] = {
                    'command': command,
                    'subprocesses': [],
                    'direction': self.directions.get(direction, None)
                }
                current_address = address
            elif current_address and line.startswith('    '):
                # Indented line, treat as part of current address
                sub_address = f"{current_address}.{len(self.workflow[current_address]['subprocesses'])+1}"
                self.workflow[current_address]['subprocesses'].append(sub_address)
                self.workflow[sub_address] = {'command': line.strip(), 'subprocesses': [], 'direction': None}

        return self.workflow

    def clone_process(self, source_address, new_address):
        """Clone a process to a new address."""
        if source_address in self.workflow:
            self.workflow[new_address] = self.workflow[source_address].copy()
            self.workflow[new_address]['subprocesses'] = []