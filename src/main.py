# src/main.py
from parser.codemap_parser import CodeMapParser
from tracer.execution_tracer import ExecutionTracer
from visualization.map_generator import MapGenerator

def main():
    # Parse a sample CodeMapping file
    parser = CodeMapParser()
    workflow = parser.parse_file('examples/sample.codemap')

    # Trace execution of a sample function
    def sample_program():
        print("Start")
        x = 5
        if x > 0:
            print("Positive")

    tracer = ExecutionTracer()
    execution_map = tracer.start_tracing(sample_program)

    # Generate 3D map
    generator = MapGenerator(workflow, execution_map)
    map_data = generator.generate_map()
    generator.save_map('src/visualization/map_data.json')

if __name__ == "__main__":
    main()
