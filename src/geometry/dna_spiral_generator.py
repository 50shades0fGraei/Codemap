import math
import numpy as np

class DNASpiralGenerator:
    """Generates DNA-like spiral coordinates using base 44 structure with fork handling."""
    
    def __init__(self, base=44, helix_radius=10, pitch=5, fork_offset=15):
        self.base = base
        self.helix_radius = helix_radius
        self.pitch = pitch  # Vertical distance per full rotation
        self.fork_offset = fork_offset  # Distance offset for fork spirals
        self.base_pairs = self._generate_base_pairs()
        self.fork_spirals = {}  # Track active fork spirals
    
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
    
    def detect_code_forks(self, code_structure):
        """Detect forks in code structure (if/else, loops, function calls)."""
        forks = []
        
        for process in code_structure:
            if 'type' in process:
                if process['type'] in ['if', 'while', 'for', 'function_call', 'try']:
                    forks.append({
                        'process_id': process['id'],
                        'fork_type': process['type'],
                        'branches': process.get('branches', []),
                        'merge_point': process.get('merge_point', None)
                    })
        
        return forks
    
    def generate_fork_spiral_coordinates(self, main_coords, fork_info, branch_index=0):
        """Generate spiral coordinates for a code fork."""
        main_process = main_coords[fork_info['process_id']]
        
        # Determine fork direction based on branch index
        # Left forks for even branches, right forks for odd branches
        direction_multiplier = -1 if branch_index % 2 == 0 else 1
        
        # Calculate fork offset position
        fork_x_offset = self.fork_offset * direction_multiplier
        fork_y_offset = self.fork_offset * 0.5 * direction_multiplier
        
        # Start fork spiral from main process position
        start_x = main_process['coords'][0] + fork_x_offset
        start_y = main_process['coords'][1] + fork_y_offset
        start_height = main_process['coords'][2]
        
        fork_coordinates = []
        branch_processes = fork_info['branches'][branch_index] if branch_index < len(fork_info['branches']) else []
        
        for i, process in enumerate(branch_processes):
            # Fork spirals are smaller and tighter
            fork_radius = self.helix_radius * 0.6
            fork_pitch = self.pitch * 0.8
            
            # Calculate spiral for fork
            angle = (2 * math.pi * i) / (self.base / 4)  # Tighter spiral
            
            # Fork direction: right on way down, left on way up
            if i < len(branch_processes) / 2:  # Going down
                spiral_direction = 1  # Right spiral
            else:  # Going up (returning to main)
                spiral_direction = -1  # Left spiral
            
            height = start_height + (i * fork_pitch) / (self.base / 4)
            
            x = start_x + fork_radius * math.cos(angle * spiral_direction)
            y = start_y + fork_radius * math.sin(angle * spiral_direction)
            
            # Assign base pair for fork
            base_index = i % self.base
            base = list(self.base_pairs.keys())[base_index]
            complement = self.base_pairs[base]
            
            fork_coordinates.append({
                'index': i,
                'process_id': process.get('id', f"fork_{fork_info['process_id']}_{i}"),
                'coords': [x, y, height],
                'strand': 'fork',
                'base': base,
                'complement': complement,
                'angle': angle,
                'fork_parent': fork_info['process_id'],
                'fork_type': fork_info['fork_type'],
                'branch_index': branch_index,
                'spiral_direction': spiral_direction
            })
        
        return fork_coordinates
    
    def generate_main_spiral_coordinates(self, process_count, direction='down'):
        """Generate main spiral coordinates with proper up/down direction."""
        coordinates = []
        
        for i in range(process_count):
            # Main spiral: right on way down, left on way up
            if direction == 'down':
                spiral_multiplier = 1  # Right spiral going down
                height = (i * self.pitch) / (self.base / 2)
            else:  # direction == 'up'
                spiral_multiplier = -1  # Left spiral going up
                height = ((process_count - i) * self.pitch) / (self.base / 2)
            
            # Calculate angle for spiral
            angle = (2 * math.pi * i * spiral_multiplier) / (self.base / 2)
            
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
                'spiral_direction': spiral_multiplier,
                'base_pair_id': f"{base}-{complement}",
                'is_main_spiral': True
            })
        
        return coordinates
    
    def generate_complete_spiral_system(self, code_structure):
        """Generate complete spiral system with main spiral and all forks."""
        # Generate main spiral
        main_processes = [p for p in code_structure if p.get('is_main', True)]
        main_coords = self.generate_main_spiral_coordinates(len(main_processes))
        
        # Create lookup for main coordinates by process ID
        main_coord_lookup = {}
        for i, process in enumerate(main_processes):
            if i < len(main_coords):
                main_coord_lookup[process['id']] = main_coords[i]
        
        # Detect and generate fork spirals
        forks = self.detect_code_forks(code_structure)
        all_coordinates = main_coords.copy()
        
        for fork in forks:
            if fork['process_id'] in main_coord_lookup:
                # Generate coordinates for each branch of the fork
                for branch_idx in range(len(fork['branches'])):
                    fork_coords = self.generate_fork_spiral_coordinates(
                        main_coord_lookup, fork, branch_idx
                    )
                    all_coordinates.extend(fork_coords)
        
        return {
            'main_spiral': main_coords,
            'fork_spirals': [coord for coord in all_coordinates if not coord.get('is_main_spiral', False)],
            'all_coordinates': all_coordinates,
            'fork_info': forks
        }
