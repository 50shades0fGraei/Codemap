from collections import defaultdict
import re

class ProcessCategorizer:
    """Categorizes processes into workflows and subcategories."""
    
    def __init__(self):
        self.categories = {
            'data': ['fetch', 'load', 'save', 'process_data', 'transform'],
            'computation': ['calculate', 'compute', 'analyze', 'algorithm'],
            'io': ['read', 'write', 'print', 'input', 'output'],
            'control': ['if', 'while', 'for', 'loop', 'condition'],
            'crypto': ['encrypt', 'decrypt', 'hash', 'sign', 'verify'],
            'network': ['request', 'response', 'api', 'http', 'socket'],
            'ui': ['render', 'display', 'show', 'hide', 'update'],
            'error': ['try', 'catch', 'error', 'exception', 'handle']
        }
        
        self.workflows = defaultdict(list)
        self.subcategories = defaultdict(dict)
    
    def categorize_process(self, address, command):
        """Categorize a single process based on its command."""
        command_lower = command.lower()
        
        # Find matching category
        matched_category = 'general'
        for category, keywords in self.categories.items():
            if any(keyword in command_lower for keyword in keywords):
                matched_category = category
                break
        
        return {
            'address': address,
            'command': command,
            'category': matched_category,
            'keywords': self._extract_keywords(command_lower, matched_category)
        }
    
    def _extract_keywords(self, command, category):
        """Extract relevant keywords from command for the category."""
        if category in self.categories:
            return [kw for kw in self.categories[category] if kw in command]
        return []
    
    def build_workflow_map(self, workflow_data):
        """Build categorized workflow map from parsed data."""
        categorized_map = {}
        
        for address, details in workflow_data.items():
            categorized = self.categorize_process(address, details['command'])
            
            # Add original details
            categorized.update({
                'subprocesses': details.get('subprocesses', []),
                'direction': details.get('direction'),
                'parent': self._find_parent(address),
                'depth': self._calculate_depth(address)
            })
            
            categorized_map[address] = categorized
            
            # Group by category for workflow organization
            category = categorized['category']
            self.workflows[category].append(address)
        
        return categorized_map
    
    def _find_parent(self, address):
        """Find parent process address."""
        if '.' in address:
            return address.rsplit('.', 1)[0]
        return None
    
    def _calculate_depth(self, address):
        """Calculate nesting depth of process."""
        return address.count('.')
    
    def get_workflow_subcategories(self, category):
        """Get subcategories within a workflow category."""
        if category not in self.subcategories:
            processes = self.workflows[category]
            subcats = defaultdict(list)
            
            for process in processes:
                # Group by first letter or pattern
                if process.startswith('A'):
                    subcats['primary'].append(process)
                elif process.startswith('B'):
                    subcats['secondary'].append(process)
                else:
                    subcats['utility'].append(process)
            
            self.subcategories[category] = dict(subcats)
        
        return self.subcategories[category]
    
    def generate_process_tree(self, categorized_map):
        """Generate hierarchical process tree for navigation."""
        tree = defaultdict(lambda: defaultdict(list))
        
        for address, details in categorized_map.items():
            category = details['category']
            depth = details['depth']
            parent = details['parent']
            
            if depth == 0:
                tree[category]['root'].append(address)
            else:
                tree[category][parent].append(address)
        
        return dict(tree)
