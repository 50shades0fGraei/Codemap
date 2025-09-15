import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import numpy as np

class ForkVisualizer:
    """Visualizes code forks in 3D spiral system."""
    
    def __init__(self, spiral_generator):
        self.spiral_generator = spiral_generator
        self.colors = {
            'main': '#00ff88',
            'if': '#ff6b6b',
            'while': '#4ecdc4',
            'for': '#45b7d1',
            'function_call': '#96ceb4',
            'try': '#ffeaa7'
        }
    
    def visualize_3d_spiral_system(self, spiral_system):
        """Create 3D visualization of complete spiral system with forks."""
        fig = plt.figure(figsize=(15, 10))
        ax = fig.add_subplot(111, projection='3d')
        
        # Plot main spiral
        main_coords = spiral_system['main_spiral']
        if main_coords:
            x_main = [coord['coords'][0] for coord in main_coords]
            y_main = [coord['coords'][1] for coord in main_coords]
            z_main = [coord['coords'][2] for coord in main_coords]
            
            ax.plot(x_main, y_main, z_main, 
                   color=self.colors['main'], linewidth=3, 
                   label='Main Process Flow', alpha=0.8)
            ax.scatter(x_main, y_main, z_main, 
                      color=self.colors['main'], s=50, alpha=0.9)
        
        # Plot fork spirals
        fork_coords = spiral_system['fork_spirals']
        fork_groups = {}
        
        # Group fork coordinates by parent and type
        for coord in fork_coords:
            key = f"{coord['fork_parent']}_{coord['fork_type']}_{coord['branch_index']}"
            if key not in fork_groups:
                fork_groups[key] = []
            fork_groups[key].append(coord)
        
        # Plot each fork group
        for fork_key, coords in fork_groups.items():
            if coords:
                fork_type = coords[0]['fork_type']
                color = self.colors.get(fork_type, '#888888')
                
                x_fork = [coord['coords'][0] for coord in coords]
                y_fork = [coord['coords'][1] for coord in coords]
                z_fork = [coord['coords'][2] for coord in coords]
                
                ax.plot(x_fork, y_fork, z_fork, 
                       color=color, linewidth=2, 
                       label=f'{fork_type.title()} Fork', alpha=0.7)
                ax.scatter(x_fork, y_fork, z_fork, 
                          color=color, s=30, alpha=0.8)
                
                # Draw connection lines from main spiral to fork start
                if coords:
                    main_parent = None
                    for main_coord in main_coords:
                        if main_coord.get('index') == coords[0]['fork_parent']:
                            main_parent = main_coord
                            break
                    
                    if main_parent:
                        ax.plot([main_parent['coords'][0], coords[0]['coords'][0]],
                               [main_parent['coords'][1], coords[0]['coords'][1]],
                               [main_parent['coords'][2], coords[0]['coords'][2]],
                               color=color, linestyle='--', alpha=0.5)
        
        ax.set_xlabel('X (Left-Right Forks)')
        ax.set_ylabel('Y (Process Flow)')
        ax.set_zlabel('Z (Execution Height)')
        ax.set_title('DNA Spiral Code Map with Fork Visualization')
        ax.legend()
        
        return fig
    
    def generate_2d_birds_eye_with_forks(self, spiral_system):
        """Generate 2D bird's eye view showing fork relationships."""
        fig, ax = plt.subplots(figsize=(12, 12))
        
        # Plot main spiral in 2D
        main_coords = spiral_system['main_spiral']
        if main_coords:
            x_main = [coord['coords'][0] for coord in main_coords]
            y_main = [coord['coords'][1] for coord in main_coords]
            
            ax.plot(x_main, y_main, color=self.colors['main'], 
                   linewidth=3, label='Main Process', alpha=0.8)
            ax.scatter(x_main, y_main, color=self.colors['main'], 
                      s=100, alpha=0.9, zorder=5)
        
        # Plot fork spirals in 2D
        fork_coords = spiral_system['fork_spirals']
        fork_groups = {}
        
        for coord in fork_coords:
            key = f"{coord['fork_parent']}_{coord['fork_type']}_{coord['branch_index']}"
            if key not in fork_groups:
                fork_groups[key] = []
            fork_groups[key].append(coord)
        
        for fork_key, coords in fork_groups.items():
            if coords:
                fork_type = coords[0]['fork_type']
                color = self.colors.get(fork_type, '#888888')
                
                x_fork = [coord['coords'][0] for coord in coords]
                y_fork = [coord['coords'][1] for coord in coords]
                
                ax.plot(x_fork, y_fork, color=color, linewidth=2, 
                       label=f'{fork_type.title()}', alpha=0.7)
                ax.scatter(x_fork, y_fork, color=color, s=60, alpha=0.8)
        
        ax.set_xlabel('X Position (Fork Direction)')
        ax.set_ylabel('Y Position (Process Flow)')
        ax.set_title('Bird\'s Eye View: Code Forks and Process Flow')
        ax.legend()
        ax.grid(True, alpha=0.3)
        ax.set_aspect('equal')
        
        return fig
