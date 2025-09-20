from parser.codemap_parser import CodeMapParser
from tracer.execution_tracer import ExecutionTracer
from geometry.dna_spiral_generator import DNASpiralGenerator
from categorization.process_categorizer import ProcessCategorizer
from addressing.location_legend import LocationLegend
from addressing.process_router import ProcessRouter
from visualization.dual_view_generator import DualViewGenerator
from visualization.view_controller import ViewController
from optimization.execution_optimizer import ExecutionOptimizer

def main():
    """Enhanced main function with DNA spiral mapping and optimization."""
    print("Starting Enhanced CodeMap System...")
    
    # Initialize components
    parser = CodeMapParser()
    tracer = ExecutionTracer()
    spiral_generator = DNASpiralGenerator(base=44, helix_radius=10, pitch=5)
    categorizer = ProcessCategorizer()
    
    # Parse workflow
    print("Parsing workflow...")
    workflow = parser.parse_file('examples/sample.codemap')
    
    # Categorize processes
    print("Categorizing processes...")
    categorized_map = categorizer.build_workflow_map(workflow)
    
    # Generate DNA spiral coordinates
    print("Generating DNA spiral coordinates...")
    spiral_coordinates = spiral_generator.generate_spiral_coordinates(len(categorized_map))
    
    # Create location legend
    print("Creating location legend...")
    location_legend = LocationLegend(spiral_generator, categorizer)
    legend_data = location_legend.generate_legend(categorized_map, spiral_coordinates)
    
    # Initialize process router
    print("Setting up process routing...")
    process_router = ProcessRouter(location_legend)
    dependency_graph = process_router.build_dependency_graph(categorized_map)
    
    # Create dual view system
    print("Generating dual view system...")
    dual_view_generator = DualViewGenerator(spiral_generator, location_legend)
    dual_views = dual_view_generator.generate_synchronized_views(categorized_map, spiral_coordinates)
    
    # Initialize optimization engine
    print("Initializing optimization engine...")
    optimizer = ExecutionOptimizer(process_router, location_legend)
    optimizer.initialize_optimization_rules()
    
    # Example optimization
    target_processes = list(categorized_map.keys())[:5]  # First 5 processes
    print(f"Optimizing execution for processes: {target_processes}")
    
    optimization_plan = optimizer.optimize_execution_path(target_processes)
    print(f"Optimization plan created:")
    print(f"  - Original processes: {len(optimization_plan['original_path'])}")
    print(f"  - Optimized processes: {len(optimization_plan['optimized_path'])}")
    print(f"  - Skipped processes: {len(optimization_plan['skipped_processes'])}")
    print(f"  - Estimated time savings: {optimization_plan['estimated_savings']['time']:.2f}s")
    
    # Execute optimized plan
    print("Executing optimized plan...")
    execution_results = optimizer.execute_optimized_plan(optimization_plan)
    print(f"Execution completed in {execution_results['performance']['total_time']:.2f}s")
    
    # Save all data
    print("Saving generated data...")
    location_legend.save_legend('output/location_legend.json')
    dual_view_generator.save_dual_views(dual_views, 'output/views')
    
    # Generate optimization report
    optimization_report = optimizer.get_optimization_report()
    print("\nOptimization Report:")
    print(f"  - Total processes tracked: {optimization_report['summary']['total_processes_tracked']}")
    print(f"  - Cache hit rate: {optimization_report['summary']['cache_hit_rate']:.2%}")
    print(f"  - Recommendations: {len(optimization_report['recommendations'])}")
    
    print("\nEnhanced CodeMap System initialization complete!")
    print("Features available:")
    print("  ✓ DNA Spiral Base-44 Structure")
    print("  ✓ Process Categorization & Workflows")
    print("  ✓ Location Legend & Addressing")
    print("  ✓ 3D Spiral & 2D Bird's Eye Views")
    print("  ✓ Execution Optimization Engine")
    
    return {
        'categorized_map': categorized_map,
        'spiral_coordinates': spiral_coordinates,
        'legend_data': legend_data,
        'dual_views': dual_views,
        'optimization_report': optimization_report
    }

if __name__ == "__main__":
    results = main()
