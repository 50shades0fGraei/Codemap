import math
import numpy as np

class DNASpiralGenerator:
    """Generates DNA-like spiral coordinates using base 44 structure."""
    
    def __init__(self, base=44, helix_radius=10, pitch=5):
        self.base = base
        self.helix_radius = helix_radius
        self.pitch = pitch  # Vertical distance per full rotation
        self.base_pairs = self._generate_base_pairs()
    
    def _generate_base_pairs(self):
        """Generate base 44 pairing system for DNA structure."""
        # Create 44 unique base identifiers
        bases = []
        for i in range(self.base):
            if i < 26:
                bases.append(chr(ord('A') + i))  # A-Z
            else:
                bases.append(f"X{i-25}")  # X1-X18 for remaining bases
        
        # Create complementary pairs
        pairs = {}
        for i in range(self.base // 2):
            pairs[bases[i]] = bases[self.base - 1 - i]
            pairs[bases[self.base - 1 - i]] = bases[i]
        
        return pairs
    
    def generate_spiral_coordinates(self, process_count):
        """Generate 3D spiral coordinates for processes."""
        coordinates = []
        
        for i in range(process_count):
            # Calculate angle for spiral
            angle = (2 * math.pi * i) / (self.base / 2)  # Two strands
            
            # Calculate height along spiral
            height = (i * self.pitch) / (self.base / 2)
            
            # Determine which strand (0 or 1)
            strand = i % 2
            
            # Calculate x, y coordinates for double helix
            if strand == 0:
                x = self.helix_radius * math.cos(angle)
                y = self.helix_radius * math.sin(angle)
            else:
                x = self.helix_radius * math.cos(angle + math.pi)
                y = self.helix_radius * math.sin(angle + math.pi)
            
            # Assign base pair
            base_index = i % self.base
            base = list(self.base_pairs.keys())[base_index]
            complement = self.base_pairs[base]
            
            coordinates.append({
                'index': i,
                'coords': [x, y, height],
                'strand': strand,
                'base': base,
                'complement': complement,
                'angle': angle,
                'base_pair_id': f"{base}-{complement}"
            })
        
        return coordinates
    
    def get_process_location(self, process_id, total_processes):
        """Get specific location for a process in the spiral."""
        spiral_coords = self.generate_spiral_coordinates(total_processes)
        
        # Convert process_id to index (e.g., A1 -> 0, A2 -> 1)
        if isinstance(process_id, str):
            # Extract number from process_id like A1, A2, etc.
            import re
            match = re.search(r'(\d+)', process_id)
            if match:
                index = int(match.group(1)) - 1
            else:
                index = 0
        else:
            index = process_id
        
        if index < len(spiral_coords):
            return spiral_coords[index]
        return None
    
    def generate_birds_eye_view(self, coordinates):
        """Generate 2D bird's eye view coordinates from 3D spiral."""
        birds_eye = []
        
        for coord in coordinates:
            # Project 3D coordinates to 2D using height as radius modifier
            height_factor = coord['coords'][2] / 10  # Scale height influence
            radius = self.helix_radius + height_factor
            
            # Use angle to position in 2D circle
            angle = coord['angle']
            x_2d = radius * math.cos(angle)
            y_2d = radius * math.sin(angle)
            
            birds_eye.append({
                'index': coord['index'],
                'coords_2d': [x_2d, y_2d],
                'coords_3d': coord['coords'],
                'base': coord['base'],
                'strand': coord['strand']
            })
        
        return birds_eye
