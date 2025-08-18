"""
Codemap Parser
Translates directional notation into spatial coordinates and subprocess forks.
"""

DIRECTION_MAP = {
    "↑": (0, 1, 0),     # Up
    "↓": (0, -1, 0),    # Down
    "→": (1, 0, 0),     # Right
    "←": (-1, 0, 0),    # Left
    "↗": (1, 1, 0),     # Up-Right
    "↘": (1, -1, 0),    # Down-Right
    "↙": (-1, -1, 0),   # Down-Left
    "↖": (-1, 1, 0),    # Up-Left
    "⇡": (0, 0, 1),     # Ascend (Z+)
    "⇣": (0, 0, -1),    # Descend (Z-)
}

class CodemapParser:
    def __init__(self):
        self.position = (0, 0, 0)  # Starting at origin

    def parse_line(self, line):
        """
        Parses a single line of codemap syntax.
        Returns new position and command.
        """
        line = line.strip()
        if not line or line[0] not in DIRECTION_MAP:
            return None

        direction = DIRECTION_MAP[line[0]]
        command = line[1:].strip()

        new_position = tuple(self.position[i] + direction[i] for i in range(3))
        self.position = new_position

        return {
            "position": new_position,
            "command": command
        }

    def reset(self):
        self.position = (0, 0, 0)

# Example usage
if __name__ == "__main__":
    parser = CodemapParser()
    lines = ["↑ spawn joy", "→ fork clarity", "⇡ pulse resonance"]

    for line in lines:
        result = parser.parse_line(line)
        print(result)