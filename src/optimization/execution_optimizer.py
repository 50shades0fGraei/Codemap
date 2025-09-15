import time
from collections import defaultdict, deque
import hashlib

class ExecutionOptimizer:
    """Optimizes code execution by avoiding redundant processes and direct routing."""
    
    def __init__(self, process_router, location_legend):
        self.process_router = process_router
        self.location_legend = location_legend
        self.execution_cache = {}
        self.performance_metrics = {}
        self.optimization_rules = {}
        self.energy_savings = 0
        self.time_savings = 0
    
    def initialize_optimization_rules(self):
        """Initialize optimization rules for different process categories."""
        self.optimization_rules = {
            'data': {
                'cache_duration': 300,  # 5 minutes
                'skip_if_unchanged': True,
                'parallel_safe': True
            },
            'computation': {
                'cache_duration': 600,  # 10 minutes
                'skip_if_unchanged': True,
                'parallel_safe': False,
                'memoize': True
            },
            'io': {
                'cache_duration': 60,   # 1 minute
                'skip_if_unchanged': False,
                'parallel_safe': False
            },
            'control': {
                'cache_duration': 0,    # Never cache
                'skip_if_unchanged': False,
                'parallel_safe': False
            },
            'crypto': {
                'cache_duration': 1800, # 30 minutes
                'skip_if_unchanged': True,
                'parallel_safe': True,
                'memoize': True
            },
            'network': {
                'cache_duration': 120,  # 2 minutes
                'skip_if_unchanged': False,
                'parallel_safe': True
            },
            'ui': {
                'cache_duration': 30,   # 30 seconds
                'skip_if_unchanged': True,
                'parallel_safe': True
            },
            'error': {
                'cache_duration': 0,    # Never cache
                'skip_if_unchanged': False,
                'parallel_safe': False
            }
        }
    
    def optimize_execution_path(self, target_processes):
        """Optimize execution path for multiple target processes."""
        if not isinstance(target_processes, list):
            target_processes = [target_processes]
        
        optimization_plan = {
            'original_path': target_processes,
            'optimized_path': [],
            'skipped_processes': [],
            'cached_results': {},
            'parallel_groups': [],
            'estimated_savings': {'time': 0, 'energy': 0}
        }
        
        # Analyze each process
        for process in target_processes:
            process_data = self.location_legend.legend['locations'].get(process)
            if not process_data:
                continue
            
            category = process_data['category']
            rules = self.optimization_rules.get(category, {})
            
            # Check if process can be skipped
            if self._can_skip_process(process, rules):
                optimization_plan['skipped_processes'].append({
                    'process': process,
                    'reason': 'cached_result_available',
                    'cached_result': self.execution_cache.get(process)
                })
                optimization_plan['cached_results'][process] = self.execution_cache[process]
                continue
            
            # Add to optimized path
            optimization_plan['optimized_path'].append(process)
        
        # Group parallel-safe processes
        optimization_plan['parallel_groups'] = self._identify_parallel_groups(
            optimization_plan['optimized_path']
        )
        
        # Calculate estimated savings
        optimization_plan['estimated_savings'] = self._calculate_savings(optimization_plan)
        
        return optimization_plan
    
    def _can_skip_process(self, process, rules):
        """Determine if a process can be skipped based on cache and rules."""
        if not rules.get('skip_if_unchanged', False):
            return False
        
        cached_data = self.execution_cache.get(process)
        if not cached_data:
            return False
        
        # Check cache expiration
        cache_duration = rules.get('cache_duration', 0)
        if cache_duration == 0:
            return False
        
        age = time.time() - cached_data.get('timestamp', 0)
        if age > cache_duration:
            # Remove expired cache
            del self.execution_cache[process]
            return False
        
        return True
    
    def _identify_parallel_groups(self, processes):
        """Identify processes that can be executed in parallel."""
        parallel_groups = []
        current_group = []
        
        for process in processes:
            process_data = self.location_legend.legend['locations'].get(process)
            if not process_data:
                continue
            
            category = process_data['category']
            rules = self.optimization_rules.get(category, {})
            
            if rules.get('parallel_safe', False):
                current_group.append(process)
            else:
                # End current parallel group
                if current_group:
                    parallel_groups.append(current_group)
                    current_group = []
                # Add non-parallel process as single group
                parallel_groups.append([process])
        
        # Add final group if exists
        if current_group:
            parallel_groups.append(current_group)
        
        return parallel_groups
    
    def _calculate_savings(self, optimization_plan):
        """Calculate estimated time and energy savings."""
        time_saved = 0
        energy_saved = 0
        
        # Calculate savings from skipped processes
        for skipped in optimization_plan['skipped_processes']:
            process = skipped['process']
            metrics = self.performance_metrics.get(process, {})
            time_saved += metrics.get('avg_execution_time', 1.0)
            energy_saved += metrics.get('avg_energy_cost', 0.1)
        
        # Calculate savings from parallelization
        for group in optimization_plan['parallel_groups']:
            if len(group) > 1:
                # Assume parallel execution saves time proportional to group size
                group_time_saving = sum(
                    self.performance_metrics.get(p, {}).get('avg_execution_time', 1.0) 
                    for p in group[1:]  # All but the first process
                ) * 0.8  # 80% efficiency for parallel execution
                time_saved += group_time_saving
        
        return {'time': time_saved, 'energy': energy_saved}
    
    def execute_optimized_plan(self, optimization_plan):
        """Execute the optimized plan and track performance."""
        execution_results = {
            'plan': optimization_plan,
            'results': {},
            'performance': {
                'start_time': time.time(),
                'end_time': None,
                'actual_time_saved': 0,
                'processes_executed': 0,
                'processes_skipped': len(optimization_plan['skipped_processes'])
            }
        }
        
        # Use cached results for skipped processes
        for cached_process, cached_result in optimization_plan['cached_results'].items():
            execution_results['results'][cached_process] = cached_result['result']
        
        # Execute parallel groups
        for group in optimization_plan['parallel_groups']:
            if len(group) == 1:
                # Single process execution
                result = self._execute_single_process(group[0])
                execution_results['results'][group[0]] = result
                execution_results['performance']['processes_executed'] += 1
            else:
                # Parallel execution (simulated)
                parallel_results = self._execute_parallel_group(group)
                execution_results['results'].update(parallel_results)
                execution_results['performance']['processes_executed'] += len(group)
        
        execution_results['performance']['end_time'] = time.time()
        execution_results['performance']['total_time'] = (
            execution_results['performance']['end_time'] - 
            execution_results['performance']['start_time']
        )
        
        # Update performance metrics
        self._update_performance_metrics(execution_results)
        
        return execution_results
    
    def _execute_single_process(self, process):
        """Execute a single process and cache result."""
        start_time = time.time()
        
        # Simulate process execution (replace with actual execution logic)
        process_data = self.location_legend.legend['locations'].get(process, {})
        command = process_data.get('command', '')
        
        # Simple simulation - in real implementation, this would execute the actual command
        result = {
            'process': process,
            'command': command,
            'output': f"Executed: {command}",
            'success': True,
            'execution_time': time.time() - start_time
        }
        
        # Cache the result
        category = process_data.get('category', 'general')
        rules = self.optimization_rules.get(category, {})
        if rules.get('cache_duration', 0) > 0:
            self.execution_cache[process] = {
                'result': result,
                'timestamp': time.time(),
                'coordinates': process_data.get('coordinates_3d', [0, 0, 0])
            }
        
        return result
    
    def _execute_parallel_group(self, group):
        """Execute a group of processes in parallel (simulated)."""
        results = {}
        
        # In a real implementation, this would use threading or multiprocessing
        for process in group:
            results[process] = self._execute_single_process(process)
        
        return results
    
    def _update_performance_metrics(self, execution_results):
        """Update performance metrics based on execution results."""
        for process, result in execution_results['results'].items():
            if process not in self.performance_metrics:
                self.performance_metrics[process] = {
                    'execution_count': 0,
                    'total_time': 0,
                    'avg_execution_time': 0,
                    'avg_energy_cost': 0.1
                }
            
            metrics = self.performance_metrics[process]
            metrics['execution_count'] += 1
            
            if isinstance(result, dict) and 'execution_time' in result:
                metrics['total_time'] += result['execution_time']
                metrics['avg_execution_time'] = metrics['total_time'] / metrics['execution_count']
    
    def get_optimization_report(self):
        """Generate optimization performance report."""
        total_processes = len(self.performance_metrics)
        total_executions = sum(m['execution_count'] for m in self.performance_metrics.values())
        cached_hits = len(self.execution_cache)
        
        report = {
            'summary': {
                'total_processes_tracked': total_processes,
                'total_executions': total_executions,
                'cached_results': cached_hits,
                'cache_hit_rate': cached_hits / max(total_executions, 1),
                'estimated_time_saved': self.time_savings,
                'estimated_energy_saved': self.energy_savings
            },
            'category_performance': {},
            'top_optimized_processes': [],
            'recommendations': []
        }
        
        # Analyze performance by category
        category_stats = defaultdict(lambda: {'count': 0, 'avg_time': 0, 'total_time': 0})
        
        for process, metrics in self.performance_metrics.items():
            process_data = self.location_legend.legend['locations'].get(process, {})
            category = process_data.get('category', 'general')
            
            category_stats[category]['count'] += metrics['execution_count']
            category_stats[category]['total_time'] += metrics['total_time']
        
        for category, stats in category_stats.items():
            if stats['count'] > 0:
                stats['avg_time'] = stats['total_time'] / stats['count']
            report['category_performance'][category] = stats
        
        # Generate recommendations
        report['recommendations'] = self._generate_optimization_recommendations()
        
        return report
    
    def _generate_optimization_recommendations(self):
        """Generate optimization recommendations based on performance data."""
        recommendations = []
        
        # Identify frequently executed processes that could benefit from longer caching
        for process, metrics in self.performance_metrics.items():
            if metrics['execution_count'] > 10 and metrics['avg_execution_time'] > 1.0:
                process_data = self.location_legend.legend['locations'].get(process, {})
                category = process_data.get('category', 'general')
                
                recommendations.append({
                    'type': 'increase_cache_duration',
                    'process': process,
                    'category': category,
                    'reason': f"Frequently executed ({metrics['execution_count']} times) with high execution time",
                    'current_cache_duration': self.optimization_rules.get(category, {}).get('cache_duration', 0),
                    'suggested_cache_duration': min(1800, self.optimization_rules.get(category, {}).get('cache_duration', 0) * 2)
                })
        
        # Identify processes that could be parallelized
        sequential_categories = [cat for cat, rules in self.optimization_rules.items() 
                               if not rules.get('parallel_safe', False)]
        
        for category in sequential_categories:
            category_processes = [p for p, data in self.location_legend.legend['locations'].items() 
                                if data.get('category') == category]
            
            if len(category_processes) > 3:
                recommendations.append({
                    'type': 'consider_parallelization',
                    'category': category,
                    'process_count': len(category_processes),
                    'reason': f"Category has {len(category_processes)} processes that might benefit from parallel execution"
                })
        
        return recommendations
