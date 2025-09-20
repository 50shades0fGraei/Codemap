class ViewController:
    """Controls switching between 3D spiral and 2D bird's eye views."""
    
    def __init__(self, dual_view_generator):
        self.dual_view_generator = dual_view_generator
        self.current_view = '3d_spiral'
        self.view_history = []
        self.selected_nodes = set()
        self.filter_settings = {
            'categories': set(),
            'show_connections': True,
            'show_labels': True
        }
    
    def switch_view(self, target_view):
        """Switch between 3D spiral and 2D bird's eye views."""
        if target_view not in ['3d_spiral', '2d_birds_eye']:
            return False
        
        self.view_history.append(self.current_view)
        self.current_view = target_view
        
        return {
            'success': True,
            'previous_view': self.view_history[-1],
            'current_view': self.current_view,
            'transition_data': self._get_transition_data(target_view)
        }
    
    def _get_transition_data(self, target_view):
        """Get transition animation data for view switching."""
        return {
            'target_view': target_view,
            'animation_duration': 1000,
            'easing': 'ease-in-out',
            'preserve_selection': True,
            'preserve_filters': True
        }
    
    def focus_on_node(self, node_id, view_data):
        """Focus camera/view on specific node."""
        if self.current_view == '3d_spiral':
            node = next((n for n in view_data['spiral_3d']['nodes'] if n['id'] == node_id), None)
            if node:
                return {
                    'camera_target': node['position'],
                    'camera_distance': 20,
                    'highlight_node': node_id
                }
        else:
            node = next((n for n in view_data['birds_eye_2d']['nodes'] if n['id'] == node_id), None)
            if node:
                return {
                    'center': node['position_2d'],
                    'zoom_level': 2.0,
                    'highlight_node': node_id
                }
        
        return None
    
    def filter_by_category(self, categories, view_data):
        """Filter view to show only specific categories."""
        self.filter_settings['categories'] = set(categories)
        
        if self.current_view == '3d_spiral':
            filtered_nodes = [n for n in view_data['spiral_3d']['nodes'] 
                            if n['category'] in categories or not categories]
            return {
                'visible_nodes': [n['id'] for n in filtered_nodes],
                'hidden_nodes': [n['id'] for n in view_data['spiral_3d']['nodes'] 
                               if n not in filtered_nodes]
            }
        else:
            filtered_nodes = [n for n in view_data['birds_eye_2d']['nodes'] 
                            if n['category'] in categories or not categories]
            return {
                'visible_nodes': [n['id'] for n in filtered_nodes],
                'hidden_nodes': [n['id'] for n in view_data['birds_eye_2d']['nodes'] 
                               if n not in filtered_nodes]
            }
    
    def select_nodes(self, node_ids):
        """Select multiple nodes for operations."""
        self.selected_nodes.update(node_ids)
        return {
            'selected_count': len(self.selected_nodes),
            'selected_nodes': list(self.selected_nodes)
        }
    
    def clear_selection(self):
        """Clear all selected nodes."""
        self.selected_nodes.clear()
        return {'selected_count': 0}
    
    def get_view_state(self):
        """Get current view state for persistence."""
        return {
            'current_view': self.current_view,
            'view_history': self.view_history,
            'selected_nodes': list(self.selected_nodes),
            'filter_settings': self.filter_settings.copy()
        }
    
    def restore_view_state(self, state):
        """Restore view state from saved data."""
        self.current_view = state.get('current_view', '3d_spiral')
        self.view_history = state.get('view_history', [])
        self.selected_nodes = set(state.get('selected_nodes', []))
        self.filter_settings = state.get('filter_settings', {
            'categories': set(),
            'show_connections': True,
            'show_labels': True
        })
