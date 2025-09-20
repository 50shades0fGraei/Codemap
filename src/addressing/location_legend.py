import json
from collections import defaultdict

class LocationLegend:
    """Creates addressable location system for processes with legend mapping."""
    
    def __init__(self, spiral_generator, categorizer):
        self.spiral_generator = spiral_generator
        self.categorizer = categorizer
        self.legend = {}
        self.address_map = {}
        self.location_index = {}
    
    def generate_legend(self, categorized_map, spiral_coordinates):
        """Generate comprehensive location legend for all processes."""
        legend_data = {
            'metadata': {
                'total_processes': len(categorized_map),
                'spiral_base': self.spiral_generator.base,
                'categories': list(self.categorizer.workflows.keys())
            },
            'locations': {},
            'categories': {},
            'navigation': {}
        }
        
        # Create location entries for each process
        for i, (address, details) in enumerate(categorized_map.items()):
            if i < len(spiral_coordinates):
                coord_data = spiral_coordinates[i]
                
                location_entry = {
                    'address': address,
                    'command': details['command'],
                    'category': details['category'],
                    'coordinates_3d': coord_data['coords'],
                    'spiral_position': {
                        'strand': coord_data['strand'],
                        'base_pair': coord_data['base_pair_id'],
                        'angle': coord_data['angle'],
                        'index': coord_data['index']
                    },
                    'workflow_info': {
                        'parent': details.get('parent'),
                        'depth': details.get('depth', 0),
                        'subprocesses': details.get('subprocesses', [])
                    },
                    'navigation_path': self._generate_navigation_path(address, details)
                }
                
                legend_data['locations'][address] = location_entry
                self.address_map[address] = coord_data['coords']
        
        # Group by categories
        for category, processes in self.categorizer.workflows.items():
            legend_data['categories'][category] = {
                'processes': processes,
                'subcategories': self.categorizer.get_workflow_subcategories(category),
                'color_code': self._get_category_color(category)
            }
        
        # Create navigation shortcuts
        legend_data['navigation'] = self._create_navigation_shortcuts(categorized_map)
        
        self.legend = legend_data
        return legend_data
    
    def _generate_navigation_path(self, address, details):
        """Generate navigation path for quick access to process."""
        path_components = []
        
        # Add category path
        path_components.append(f"/{details['category']}")
        
        # Add hierarchical path
        if details.get('parent'):
            path_components.append(f"/{details['parent']}")
        
        path_components.append(f"/{address}")
        
        return ''.join(path_components)
    
    def _get_category_color(self, category):
        """Assign color codes to categories for visualization."""
        color_map = {
            'data': '#3B82F6',      # Blue
            'computation': '#10B981', # Green
            'io': '#F59E0B',        # Amber
            'control': '#EF4444',   # Red
            'crypto': '#8B5CF6',    # Purple
            'network': '#06B6D4',   # Cyan
            'ui': '#F97316',        # Orange
            'error': '#DC2626',     # Red-600
            'general': '#6B7280'    # Gray
        }
        return color_map.get(category, '#6B7280')
    
    def _create_navigation_shortcuts(self, categorized_map):
        """Create quick navigation shortcuts for common operations."""
        shortcuts = {
            'entry_points': [],
            'critical_paths': [],
            'error_handlers': [],
            'data_flows': []
        }
        
        for address, details in categorized_map.items():
            # Identify entry points (no parent, depth 0)
            if details.get('depth', 0) == 0:
                shortcuts['entry_points'].append({
                    'address': address,
                    'path': self._generate_navigation_path(address, details)
                })
            
            # Identify critical computation paths
            if details['category'] in ['computation', 'crypto']:
                shortcuts['critical_paths'].append({
                    'address': address,
                    'category': details['category'],
                    'path': self._generate_navigation_path(address, details)
                })
            
            # Identify error handlers
            if details['category'] == 'error':
                shortcuts['error_handlers'].append({
                    'address': address,
                    'path': self._generate_navigation_path(address, details)
                })
            
            # Identify data flow processes
            if details['category'] == 'data':
                shortcuts['data_flows'].append({
                    'address': address,
                    'path': self._generate_navigation_path(address, details)
                })
        
        return shortcuts
    
    def find_process_by_location(self, coordinates, tolerance=1.0):
        """Find process at specific 3D coordinates."""
        for address, coord in self.address_map.items():
            distance = sum((a - b) ** 2 for a, b in zip(coordinates, coord)) ** 0.5
            if distance <= tolerance:
                return address, self.legend['locations'][address]
        return None, None
    
    def get_nearby_processes(self, address, radius=5.0):
        """Get processes within radius of given address."""
        if address not in self.address_map:
            return []
        
        center_coord = self.address_map[address]
        nearby = []
        
        for other_address, coord in self.address_map.items():
            if other_address != address:
                distance = sum((a - b) ** 2 for a, b in zip(center_coord, coord)) ** 0.5
                if distance <= radius:
                    nearby.append({
                        'address': other_address,
                        'distance': distance,
                        'location_data': self.legend['locations'][other_address]
                    })
        
        return sorted(nearby, key=lambda x: x['distance'])
    
    def save_legend(self, output_file):
        """Save legend to JSON file."""
        with open(output_file, 'w') as f:
            json.dump(self.legend, f, indent=2)
    
    def generate_address_lookup(self):
        """Generate quick lookup table for addresses."""
        lookup = {}
        for address, location_data in self.legend['locations'].items():
            lookup[address] = {
                'coords': location_data['coordinates_3d'],
                'category': location_data['category'],
                'path': location_data['navigation_path'],
                'base_pair': location_data['spiral_position']['base_pair']
            }
        return lookup
