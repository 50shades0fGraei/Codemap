# src/visualization/map_generator.py
import json

class MapGenerator:
    def __init__(self, workflow, execution_map):
        self.workflow = workflow
        self.execution_map = execution_map
        self.map_data = []

    def generate_map(self):
        """Generate 3D map data combining parsed code and execution trace."""
        for address, details in self.workflow.items():
            coords = self.execution_map.get(address, [{'coords': [0, 0, 0]}])[0]['coords']
            self.map_data.append({
                'address': address,
                'command': details['command'],
                'coords': coords,
                'subprocesses': details['subprocesses'],
                'direction': details['direction']
            })
        return self.map_data

    def save_map(self, output_file):
        """Save map data to JSON for Three.js."""
        with open(output_file, 'w') as f:
            json.dump(self.map_data, f, indent=2)
