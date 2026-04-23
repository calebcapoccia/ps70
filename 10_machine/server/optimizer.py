"""
Dot placement optimizer for Braille/Tactile Art Machine
Uses nearest neighbor algorithm to minimize travel distance
"""

import math

def distance(p1, p2):
    """Calculate Euclidean distance between two points"""
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def optimize_dots(dots, start_pos=(0, 0)):
    """
    Optimize dot order using nearest neighbor algorithm
    
    Args:
        dots: List of (x, y) tuples representing dot positions
        start_pos: Starting position (default is home at 0,0)
    
    Returns:
        List of (x, y) tuples in optimized order
    """
    if len(dots) <= 1:
        return dots
    
    # Convert to list of tuples if needed
    dots = [(float(x), float(y)) for x, y in dots]
    
    optimized = []
    remaining = dots.copy()
    current = start_pos
    
    # Nearest neighbor algorithm
    while remaining:
        # Find closest dot to current position
        closest = min(remaining, key=lambda dot: distance(current, dot))
        optimized.append(closest)
        remaining.remove(closest)
        current = closest
    
    return optimized

def calculate_total_distance(dots, start_pos=(0, 0)):
    """
    Calculate total travel distance for a dot sequence
    
    Args:
        dots: List of (x, y) tuples
        start_pos: Starting position
    
    Returns:
        Total distance in mm
    """
    if not dots:
        return 0
    
    total = distance(start_pos, dots[0])
    for i in range(len(dots) - 1):
        total += distance(dots[i], dots[i + 1])
    
    return total

def compare_optimization(original_dots, optimized_dots, start_pos=(0, 0)):
    """
    Compare original vs optimized path distances
    
    Returns:
        dict with original_distance, optimized_distance, and savings_percent
    """
    original_dist = calculate_total_distance(original_dots, start_pos)
    optimized_dist = calculate_total_distance(optimized_dots, start_pos)
    
    if original_dist > 0:
        savings = ((original_dist - optimized_dist) / original_dist) * 100
    else:
        savings = 0
    
    return {
        'original_distance': round(original_dist, 2),
        'optimized_distance': round(optimized_dist, 2),
        'savings_percent': round(savings, 1),
        'savings_mm': round(original_dist - optimized_dist, 2)
    }

if __name__ == "__main__":
    # Test the optimizer
    test_dots = [
        (10, 10), (150, 200), (15, 15), (145, 195),
        (20, 20), (140, 190), (25, 25), (135, 185)
    ]
    
    print("Testing optimizer with sample dots...")
    print(f"Original order: {test_dots}")
    
    optimized = optimize_dots(test_dots)
    print(f"\nOptimized order: {optimized}")
    
    stats = compare_optimization(test_dots, optimized)
    print(f"\nOptimization results:")
    print(f"  Original distance: {stats['original_distance']} mm")
    print(f"  Optimized distance: {stats['optimized_distance']} mm")
    print(f"  Savings: {stats['savings_percent']}% ({stats['savings_mm']} mm)")
