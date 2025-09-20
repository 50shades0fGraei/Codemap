class ProcessRouter:
    """Routes execution directly to specific processes for optimization."""
    
    def __init__(self, location_legend):
        self.legend = location_legend
        self.execution_cache = {}
        self.dependency_graph = {}
    
    def build_dependency_graph(self, categorized_map):
        """Build dependency graph to identify process relationships."""
        dependencies = {}
        
        for address, details in categorized_map.items():
            dependencies[address] = {
                'depends_on': [],
                'required_by': [],
                'category': details['category'],
                'subprocesses': details.get('subprocesses', [])
            }
            
            # Analyze command for dependencies
            command = details['command'].lower()
            
            # Look for function calls or variable references
            for other_address in categorized_map.keys():
                if other_address != address and other_address.lower() in command:
                    dependencies[address]['depends_on'].append(other_address)
                    if other_address not in dependencies:
                        dependencies[other_address] = {'depends_on': [], 'required_by': []}
                    dependencies[other_address]['required_by'].append(address)
        
        self.dependency_graph = dependencies
        return dependencies
    
    def find_optimal_path(self, start_address, target_address):
        """Find optimal execution path between processes."""
        if start_address not in self.dependency_graph or target_address not in self.dependency_graph:
            return None
        
        # Simple BFS to find shortest path
        from collections import deque
        
        queue = deque([(start_address, [start_address])])
        visited = set()
        
        while queue:
            current, path = queue.popleft()
            
            if current == target_address:
                return {
                    'path': path,
                    'length': len(path),
                    'coordinates': [self.legend.address_map.get(addr, [0, 0, 0]) for addr in path]
                }
            
            if current in visited:
                continue
            
            visited.add(current)
            
            # Add connected processes
            for connected in self.dependency_graph[current]['required_by']:
                if connected not in visited:
                    queue.append((connected, path + [connected]))
        
        return None
    
    def get_direct_route(self, target_address):
        """Get direct route to process, bypassing unnecessary steps."""
        if target_address not in self.legend.address_map:
            return None
        
        # Get process location and dependencies
        location_data = self.legend.legend['locations'][target_address]
        dependencies = self.dependency_graph.get(target_address, {}).get('depends_on', [])
        
        route = {
            'target': target_address,
            'coordinates': location_data['coordinates_3d'],
            'navigation_path': location_data['navigation_path'],
            'required_dependencies': dependencies,
            'category': location_data['category'],
            'execution_order': self._calculate_execution_order(target_address)
        }
        
        return route
    
    def _calculate_execution_order(self, target_address):
        """Calculate optimal execution order for dependencies."""
        if target_address not in self.dependency_graph:
            return [target_address]
        
        dependencies = self.dependency_graph[target_address]['depends_on']
        execution_order = []
        
        # Add dependencies first (topological sort would be better for complex cases)
        for dep in dependencies:
            if dep not in execution_order:
                execution_order.extend(self._calculate_execution_order(dep))
        
        if target_address not in execution_order:
            execution_order.append(target_address)
        
        return execution_order
    
    def cache_execution_result(self, address, result):
        """Cache execution result to avoid redundant processing."""
        self.execution_cache[address] = {
            'result': result,
            'timestamp': __import__('time').time(),
            'coordinates': self.legend.address_map.get(address, [0, 0, 0])
        }
    
    def get_cached_result(self, address):
        """Get cached execution result if available."""
        return self.execution_cache.get(address)
    
    def clear_cache_by_category(self, category):
        """Clear cache for specific category of processes."""
        to_remove = []
        for address, cache_data in self.execution_cache.items():
            if address in self.legend.legend['locations']:
                if self.legend.legend['locations'][address]['category'] == category:
                    to_remove.append(address)
        
        for address in to_remove:
            del self.execution_cache[address]
