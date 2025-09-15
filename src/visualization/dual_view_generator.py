import json
import math

class DualViewGenerator:
    """Generates both 3D spiral and 2D bird's eye view visualizations."""
    
    def __init__(self, spiral_generator, location_legend):
        self.spiral_generator = spiral_generator
        self.location_legend = location_legend
        self.view_configs = {
            '3d_spiral': {
                'camera_position': [50, 50, 100],
                'camera_target': [0, 0, 0],
                'lighting': 'ambient',
                'show_connections': True,
                'show_base_pairs': True
            },
            '2d_birds_eye': {
                'center': [0, 0],
                'zoom_level': 1.0,
                'show_categories': True,
                'show_flow_arrows': True,
                'cluster_by_category': True
            }
        }
    
    def generate_3d_spiral_view(self, categorized_map, spiral_coordinates):
        """Generate 3D spiral visualization data."""
        spiral_view = {
            'metadata': {
                'view_type': '3d_spiral',
                'total_nodes': len(spiral_coordinates),
                'helix_radius': self.spiral_generator.helix_radius,
                'pitch': self.spiral_generator.pitch
            },
            'nodes': [],
            'connections': [],
            'strands': {'strand_0': [], 'strand_1': []},
            'base_pairs': [],
            'camera': self.view_configs['3d_spiral']
        }
        
        # Create nodes for each process
        for i, coord_data in enumerate(spiral_coordinates):
            address = list(categorized_map.keys())[i] if i < len(categorized_map) else f"P{i}"
            process_data = categorized_map.get(address, {})
            
            node = {
                'id': address,
                'position': coord_data['coords'],
                'strand': coord_data['strand'],
                'base': coord_data['base'],
                'complement': coord_data['complement'],
                'category': process_data.get('category', 'general'),
                'command': process_data.get('command', ''),
                'color': self.location_legend._get_category_color(process_data.get('category', 'general')),
                'size': self._calculate_node_size(process_data),
                'connections': process_data.get('subprocesses', [])
            }
            
            spiral_view['nodes'].append(node)
            spiral_view['strands'][f'strand_{coord_data["strand"]}'].append(node)
        
        # Create base pair connections
        for i in range(0, len(spiral_coordinates) - 1, 2):
            if i + 1 < len(spiral_coordinates):
                base_pair = {
                    'node1': spiral_view['nodes'][i]['id'],
                    'node2': spiral_view['nodes'][i + 1]['id'],
                    'position1': spiral_coordinates[i]['coords'],
                    'position2': spiral_coordinates[i + 1]['coords'],
                    'base_pair_id': spiral_coordinates[i]['base_pair_id']
                }
                spiral_view['base_pairs'].append(base_pair)
        
        # Create process connections
        for node in spiral_view['nodes']:
            for connection in node['connections']:
                if any(n['id'] == connection for n in spiral_view['nodes']):
                    spiral_view['connections'].append({
                        'from': node['id'],
                        'to': connection,
                        'type': 'subprocess'
                    })
        
        return spiral_view
    
    def generate_2d_birds_eye_view(self, categorized_map, spiral_coordinates):
        """Generate 2D bird's eye view visualization data."""
        birds_eye_coords = self.spiral_generator.generate_birds_eye_view(spiral_coordinates)
        
        birds_eye_view = {
            'metadata': {
                'view_type': '2d_birds_eye',
                'total_nodes': len(birds_eye_coords),
                'center': self.view_configs['2d_birds_eye']['center'],
                'zoom_level': self.view_configs['2d_birds_eye']['zoom_level']
            },
            'nodes': [],
            'categories': {},
            'clusters': {},
            'flow_arrows': [],
            'legend': {
                'categories': {},
                'symbols': {}
            }
        }
        
        # Create 2D nodes
        category_positions = {}
        for i, coord_2d in enumerate(birds_eye_coords):
            address = list(categorized_map.keys())[i] if i < len(categorized_map) else f"P{i}"
            process_data = categorized_map.get(address, {})
            category = process_data.get('category', 'general')
            
            node = {
                'id': address,
                'position_2d': coord_2d['coords_2d'],
                'position_3d': coord_2d['coords_3d'],
                'category': category,
                'command': process_data.get('command', ''),
                'color': self.location_legend._get_category_color(category),
                'size': self._calculate_node_size(process_data),
                'symbol': self._get_category_symbol(category),
                'connections': process_data.get('subprocesses', [])
            }
            
            birds_eye_view['nodes'].append(node)
            
            # Group by category for clustering
            if category not in category_positions:
                category_positions[category] = []
            category_positions[category].append(node)
        
        # Create category clusters
        for category, nodes in category_positions.items():
            if len(nodes) > 1:
                # Calculate cluster center
                center_x = sum(node['position_2d'][0] for node in nodes) / len(nodes)
                center_y = sum(node['position_2d'][1] for node in nodes) / len(nodes)
                
                birds_eye_view['clusters'][category] = {
                    'center': [center_x, center_y],
                    'nodes': [node['id'] for node in nodes],
                    'color': self.location_legend._get_category_color(category),
                    'count': len(nodes)
                }
        
        # Create flow arrows between connected processes
        for node in birds_eye_view['nodes']:
            for connection in node['connections']:
                target_node = next((n for n in birds_eye_view['nodes'] if n['id'] == connection), None)
                if target_node:
                    birds_eye_view['flow_arrows'].append({
                        'from': node['position_2d'],
                        'to': target_node['position_2d'],
                        'from_id': node['id'],
                        'to_id': target_node['id'],
                        'category': node['category']
                    })
        
        # Create legend
        for category in category_positions.keys():
            birds_eye_view['legend']['categories'][category] = {
                'color': self.location_legend._get_category_color(category),
                'symbol': self._get_category_symbol(category),
                'count': len(category_positions[category])
            }
        
        return birds_eye_view
    
    def _calculate_node_size(self, process_data):
        """Calculate node size based on process complexity."""
        base_size = 1.0
        
        # Increase size based on subprocesses
        subprocess_count = len(process_data.get('subprocesses', []))
        size_multiplier = 1.0 + (subprocess_count * 0.2)
        
        # Increase size for critical categories
        category = process_data.get('category', 'general')
        if category in ['computation', 'crypto']:
            size_multiplier *= 1.3
        elif category in ['control', 'error']:
            size_multiplier *= 1.1
        
        return base_size * size_multiplier
    
    def _get_category_symbol(self, category):
        """Get symbol representation for category in 2D view."""
        symbols = {
            'data': '◆',
            'computation': '●',
            'io': '▲',
            'control': '■',
            'crypto': '★',
            'network': '◇',
            'ui': '▼',
            'error': '⚠',
            'general': '○'
        }
        return symbols.get(category, '○')
    
    def generate_synchronized_views(self, categorized_map, spiral_coordinates):
        """Generate both views with synchronized data for seamless switching."""
        spiral_3d = self.generate_3d_spiral_view(categorized_map, spiral_coordinates)
        birds_eye_2d = self.generate_2d_birds_eye_view(categorized_map, spiral_coordinates)
        
        # Create synchronization mapping
        sync_data = {
            'node_mapping': {},
            'category_mapping': {},
            'view_transitions': {}
        }
        
        # Map nodes between views
        for node_3d in spiral_3d['nodes']:
            node_2d = next((n for n in birds_eye_2d['nodes'] if n['id'] == node_3d['id']), None)
            if node_2d:
                sync_data['node_mapping'][node_3d['id']] = {
                    'position_3d': node_3d['position'],
                    'position_2d': node_2d['position_2d'],
                    'category': node_3d['category']
                }
        
        # Create view transition animations
        for node_id, mapping in sync_data['node_mapping'].items():
            sync_data['view_transitions'][node_id] = {
                'from_3d_to_2d': {
                    'start': mapping['position_3d'],
                    'end': mapping['position_2d'] + [0],  # Add z=0 for 2D
                    'duration': 1000  # milliseconds
                },
                'from_2d_to_3d': {
                    'start': mapping['position_2d'] + [0],
                    'end': mapping['position_3d'],
                    'duration': 1000
                }
            }
        
        return {
            'spiral_3d': spiral_3d,
            'birds_eye_2d': birds_eye_2d,
            'synchronization': sync_data
        }
    
    def save_dual_views(self, dual_view_data, output_dir):
        """Save both views and synchronization data."""
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        # Save 3D spiral view
        with open(f"{output_dir}/spiral_3d_view.json", 'w') as f:
            json.dump(dual_view_data['spiral_3d'], f, indent=2)
        
        # Save 2D bird's eye view
        with open(f"{output_dir}/birds_eye_2d_view.json", 'w') as f:
            json.dump(dual_view_data['birds_eye_2d'], f, indent=2)
        
        # Save synchronization data
        with open(f"{output_dir}/view_synchronization.json", 'w') as f:
            json.dump(dual_view_data['synchronization'], f, indent=2)
