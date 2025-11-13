#!/usr/bin/env python3
"""
Generate thumbnails for SWC files in the four datasets.
Each thumbnail shows only the neuron skeleton (blue) and soma points (red) without any coordinate system or grid.
- White background for clean appearance
- Complete neuron visibility with generous padding
- Blue skeleton lines with radius-based thickness
- Red soma points with radius-based size
"""

import os
import sys
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle
import glob
from pathlib import Path

# Add the parent directory to the path to import swc_to_obj
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def parse_swc_file(swc_path):
    """Parse SWC file and return nodes and connections."""
    nodes = {}
    connections = []
    
    with open(swc_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('#') or not line:
                continue
            
            parts = line.split()
            if len(parts) < 7:
                continue
                
            try:
                node_id = int(parts[0])
                node_type = int(parts[1])
                x = float(parts[2])
                y = float(parts[3])
                z = float(parts[4])
                radius = float(parts[5])
                parent_id = int(parts[6])
                
                nodes[node_id] = {
                    'type': node_type,
                    'x': x, 'y': y, 'z': z,
                    'radius': radius,
                    'parent_id': parent_id
                }
                
                if parent_id != -1 and parent_id in nodes:
                    connections.append((parent_id, node_id))
                    
            except (ValueError, IndexError):
                continue
    
    return nodes, connections

def generate_thumbnail(swc_path, output_path, size=(400, 400), dpi=100):
    """Generate a clean thumbnail for an SWC file."""
    try:
        nodes, connections = parse_swc_file(swc_path)
        
        if not nodes:
            print(f"No valid nodes found in {swc_path}")
            return False
        
        # Extract coordinates and radii
        coords = np.array([[nodes[nid]['x'], nodes[nid]['y'], nodes[nid]['z']] for nid in nodes])
        radii = np.array([nodes[nid]['radius'] for nid in nodes])
        types = np.array([nodes[nid]['type'] for nid in nodes])
        
        # Find the best 2D projection (use the two dimensions with the largest spread)
        ranges = np.ptp(coords, axis=0)
        dims = np.argsort(ranges)[-2:]  # Take the two dimensions with largest range
        
        x_coords = coords[:, dims[0]]
        y_coords = coords[:, dims[1]]
        
        # Create figure with clean white background
        fig, ax = plt.subplots(figsize=(size[0]/dpi, size[1]/dpi), dpi=dpi)
        ax.set_facecolor('white')
        
        # Set equal aspect ratio and remove all decorations
        ax.set_aspect('equal')
        ax.axis('off')
        
        # Calculate bounds to ensure complete neuron view
        x_min, x_max = np.min(x_coords), np.max(x_coords)
        y_min, y_max = np.min(y_coords), np.max(y_coords)
        
        # Add generous padding to ensure complete visibility
        x_range = x_max - x_min
        y_range = y_max - y_min
        max_range = max(x_range, y_range)
        
        # Use 20% padding to ensure full neuron visibility
        padding = max_range * 0.2 if max_range > 0 else 1
        
        # Set limits with padding
        ax.set_xlim(x_min - padding, x_max + padding)
        ax.set_ylim(y_min - padding, y_max + padding)
        
        # Draw connections (skeleton) in blue
        for parent_id, child_id in connections:
            if parent_id in nodes and child_id in nodes:
                parent_coord = [nodes[parent_id]['x'], nodes[parent_id]['y'], nodes[parent_id]['z']]
                child_coord = [nodes[child_id]['x'], nodes[child_id]['y'], nodes[child_id]['z']]
                
                parent_2d = [parent_coord[dims[0]], parent_coord[dims[1]]]
                child_2d = [child_coord[dims[0]], child_coord[dims[1]]]
                
                # Draw line with thickness based on radius
                parent_radius = nodes[parent_id]['radius']
                child_radius = nodes[child_id]['radius']
                avg_radius = (parent_radius + child_radius) / 2
                
                # Scale line width (minimum 0.5, maximum 3.0)
                line_width = max(0.5, min(3.0, avg_radius * 2))
                
                # Check for valid coordinates
                if (np.isfinite(parent_2d[0]) and np.isfinite(parent_2d[1]) and 
                    np.isfinite(child_2d[0]) and np.isfinite(child_2d[1])):
                    ax.plot([parent_2d[0], child_2d[0]], [parent_2d[1], child_2d[1]], 
                           '-', linewidth=line_width, alpha=0.9, color='#0066CC')
        
        # Draw soma points in red
        soma_nodes = [nid for nid in nodes if nodes[nid]['type'] == 1]  # Type 1 is soma
        for soma_id in soma_nodes:
            soma_coord = [nodes[soma_id]['x'], nodes[soma_id]['y'], nodes[soma_id]['z']]
            soma_2d = [soma_coord[dims[0]], soma_coord[dims[1]]]
            radius = nodes[soma_id]['radius']
            
            # Check for valid coordinates
            if np.isfinite(soma_2d[0]) and np.isfinite(soma_2d[1]):
                # Scale circle size (minimum 3, maximum 25)
                circle_size = max(3, min(25, radius * 12))
                
                circle = Circle(soma_2d, circle_size, color='#CC0000', alpha=0.95)
                ax.add_patch(circle)
        
        # Save the thumbnail
        try:
            plt.tight_layout(pad=0)
        except:
            pass  # Skip tight_layout if it fails
        plt.savefig(output_path, dpi=dpi, bbox_inches='tight', 
                   facecolor='white', edgecolor='none', pad_inches=0)
        plt.close()
        
        return True
        
    except Exception as e:
        print(f"Error generating thumbnail for {swc_path}: {e}")
        return False

def process_dataset(dataset_path, dataset_name):
    """Process all SWC files in a dataset."""
    print(f"\nProcessing dataset: {dataset_name}")
    print(f"Dataset path: {dataset_path}")
    
    # Check if path exists using multiple methods
    path_exists = False
    try:
        path_exists = os.path.exists(dataset_path)
    except:
        pass
    
    if not path_exists:
        try:
            # Try using pathlib for better network drive support
            from pathlib import Path
            path_exists = Path(dataset_path).exists()
        except:
            pass
    
    if not path_exists:
        try:
            # Try using subprocess to check path
            import subprocess
            result = subprocess.run(['dir', dataset_path], 
                                  capture_output=True, text=True, shell=True)
            path_exists = result.returncode == 0
        except:
            pass
    
    if not path_exists:
        print(f"Dataset path does not exist: {dataset_path}")
        print(f"Trying to continue anyway...")
        # Don't return, try to continue
    
    # Find all SWC files in results subdirectories
    results_path = os.path.join(dataset_path, "results")
    print(f"Looking for results path: {results_path}")
    
    # Use os.walk to find SWC files (better for network drives)
    swc_files = []
    try:
        for root, dirs, files in os.walk(results_path):
            for file in files:
                if file == "data.swc":
                    swc_files.append(os.path.join(root, file))
    except Exception as e:
        print(f"Error walking directory: {e}")
    
    # If no files found, try alternative patterns
    if not swc_files:
        print("No files found with standard pattern, trying alternatives...")
        try:
            # Try without results subdirectory
            for root, dirs, files in os.walk(dataset_path):
                for file in files:
                    if file == "data.swc":
                        swc_files.append(os.path.join(root, file))
        except Exception as e:
            print(f"Error walking dataset directory: {e}")
        
        # Try with .swc extension
        if not swc_files:
            try:
                for root, dirs, files in os.walk(results_path):
                    for file in files:
                        if file.endswith(".swc"):
                            swc_files.append(os.path.join(root, file))
            except Exception as e:
                print(f"Error walking for .swc files: {e}")
    
    print(f"Found {len(swc_files)} SWC files")
    
    success_count = 0
    permission_error_count = 0
    
    for swc_file in swc_files:
        # Get the directory of the SWC file
        swc_dir = os.path.dirname(swc_file)
        swc_name = os.path.splitext(os.path.basename(swc_file))[0]
        
        # Create thumbnail filename (use the parent directory name for the thumbnail)
        parent_dir = os.path.basename(os.path.dirname(swc_file))
        thumbnail_path = os.path.join(swc_dir, f"{parent_dir}_thumbnail.png")
        
        # Skip if thumbnail already exists
        if os.path.exists(thumbnail_path):
            print(f"Thumbnail already exists: {thumbnail_path}")
            continue
        
        # Check if we can read the SWC file
        try:
            with open(swc_file, 'r') as f:
                f.read(1)  # Try to read at least one character
        except PermissionError:
            print(f"Permission denied for: {swc_file}")
            permission_error_count += 1
            continue
        except Exception as e:
            print(f"Error accessing {swc_file}: {e}")
            continue
        
        print(f"Generating thumbnail for: {swc_file}")
        if generate_thumbnail(swc_file, thumbnail_path):
            success_count += 1
            print(f"✓ Generated: {thumbnail_path}")
        else:
            print(f"✗ Failed: {swc_file}")
    
    print(f"Successfully generated {success_count} thumbnails for {dataset_name}")
    if permission_error_count > 0:
        print(f"Permission denied for {permission_error_count} files")

def main():
    """Main function to process all four datasets."""
    # Define the four dataset paths
    base_path = "Y:\\morphtesser_exp\\Final_Results_Datasets"
    
    datasets = {
        "peng": os.path.join(base_path, "peng"),
        "qiu": os.path.join(base_path, "qiu"),
        "gao": os.path.join(base_path, "gao"),
        "winnubst": os.path.join(base_path, "winnubst")
    }
    
    print("Starting SWC thumbnail generation for all datasets...")
    print("=" * 60)
    
    total_success = 0
    for dataset_name, dataset_path in datasets.items():
        try:
            process_dataset(dataset_path, dataset_name)
        except Exception as e:
            print(f"Error processing dataset {dataset_name}: {e}")
    
    print("\n" + "=" * 60)
    print("Thumbnail generation completed!")

if __name__ == "__main__":
    main()
