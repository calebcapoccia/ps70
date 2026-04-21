"""
Braille converter for tactile art machine
Converts text to Braille dot coordinates with proper spacing and mirroring
"""

# Braille dot patterns (1-6 in 2x3 grid)
# 1 4
# 2 5
# 3 6
BRAILLE = {
    'A': [1], 'B': [1,2], 'C': [1,4], 'D': [1,4,5], 'E': [1,5],
    'F': [1,2,4], 'G': [1,2,4,5], 'H': [1,2,5], 'I': [2,4], 'J': [2,4,5],
    'K': [1,3], 'L': [1,2,3], 'M': [1,3,4], 'N': [1,3,4,5], 'O': [1,3,5],
    'P': [1,2,3,4], 'Q': [1,2,3,4,5], 'R': [1,2,3,5], 'S': [2,3,4], 'T': [2,3,4,5],
    'U': [1,3,6], 'V': [1,2,3,6], 'W': [2,4,5,6], 'X': [1,3,4,6], 'Y': [1,3,4,5,6],
    'Z': [1,3,5,6],
    '0': [3,4,5,6], '1': [2], '2': [2,3], '3': [2,5], '4': [2,5,6],
    '5': [2,6], '6': [2,3,5], '7': [2,3,5,6], '8': [2,3,6], '9': [3,5],
    ' ': [],  # Space
    '.': [4,6], ',': [6], '!': [2,3,5], '?': [2,3,6],
}

# Physical constraints
WORK_WIDTH = 170      # mm
WORK_HEIGHT = 250     # mm
DOT_SIZE = 3          # mm
DOT_SPACING = 5       # mm within cell (scaled 2x from standard)
CELL_WIDTH = 17       # mm per character (including spacing)
LINE_HEIGHT = 28      # mm per line (including spacing)
MAX_CHARS_PER_LINE = 10
MAX_LINES = 8

def braille_to_coords(text, start_x=10, start_y=10, mirror=True):
    """
    Convert text to Braille dot coordinates
    
    Args:
        text: Input text string
        start_x: Starting X position (mm)
        start_y: Starting Y position (mm)
        mirror: Whether to mirror horizontally (for flip-over embossing)
    
    Returns:
        List of (x, y) tuples in mm
    """
    coords = []
    line_length = 0
    current_line = 0
    
    for char in text.upper():
        # Handle newlines
        if char == '\n':
            current_line += 1
            line_length = 0
            continue
        
        # Check if we need to wrap to next line
        if line_length >= MAX_CHARS_PER_LINE:
            current_line += 1
            line_length = 0
        
        # Check if we're out of vertical space
        if current_line >= MAX_LINES:
            print(f"Warning: Text exceeds {MAX_LINES} lines, truncating")
            break
        
        # Skip unknown characters
        if char not in BRAILLE:
            if char != ' ':
                print(f"Warning: Character '{char}' not in Braille table, skipping")
            line_length += 1
            continue
        
        # Calculate cell position
        cell_x = start_x + (line_length * CELL_WIDTH)
        cell_y = start_y + (current_line * LINE_HEIGHT)
        
        # Add dots for this character
        for dot in BRAILLE[char]:
            # Dot positions in 2x3 grid
            # Left column: dots 1,2,3  Right column: dots 4,5,6
            col = 0 if dot in [1, 2, 3] else 1
            row = (dot - 1) % 3
            
            x = cell_x + (col * DOT_SPACING)
            y = cell_y + (row * DOT_SPACING)
            
            # Bounds check
            if x <= WORK_WIDTH - DOT_SIZE and y <= WORK_HEIGHT - DOT_SIZE:
                coords.append((x, y))
            else:
                print(f"Warning: Dot at ({x}, {y}) out of bounds, skipping")
        
        line_length += 1
    
    # Mirror horizontally if needed (for flip-over embossing)
    if mirror:
        coords = [(WORK_WIDTH - x, y) for (x, y) in coords]
    
    return coords

def get_text_info(text):
    """
    Get information about text layout
    
    Returns:
        dict with character count, line count, and whether it fits
    """
    lines = 1
    current_line_length = 0
    total_chars = 0
    
    for char in text.upper():
        if char == '\n':
            lines += 1
            current_line_length = 0
            continue
        
        if char in BRAILLE:
            total_chars += 1
            current_line_length += 1
            
            if current_line_length >= MAX_CHARS_PER_LINE:
                lines += 1
                current_line_length = 0
    
    fits = lines <= MAX_LINES and total_chars > 0
    
    return {
        'total_chars': total_chars,
        'lines': lines,
        'fits': fits,
        'max_chars': MAX_CHARS_PER_LINE * MAX_LINES
    }

def word_wrap(text, max_chars_per_line=MAX_CHARS_PER_LINE):
    """
    Wrap text to fit within character limit per line
    
    Args:
        text: Input text
        max_chars_per_line: Maximum characters per line
    
    Returns:
        Text with newlines inserted
    """
    words = text.split()
    lines = []
    current_line = []
    current_length = 0
    
    for word in words:
        word_length = len(word)
        
        # Check if adding this word would exceed line length
        if current_length + word_length + len(current_line) > max_chars_per_line:
            if current_line:
                lines.append(' '.join(current_line))
                current_line = [word]
                current_length = word_length
            else:
                # Single word longer than line - truncate it
                lines.append(word[:max_chars_per_line])
                current_line = []
                current_length = 0
        else:
            current_line.append(word)
            current_length += word_length
    
    # Add remaining words
    if current_line:
        lines.append(' '.join(current_line))
    
    return '\n'.join(lines)

if __name__ == "__main__":
    # Test the converter
    test_text = "HELLO WORLD"
    print(f"Converting: {test_text}")
    
    wrapped = word_wrap(test_text)
    print(f"Wrapped text:\n{wrapped}\n")
    
    info = get_text_info(wrapped)
    print(f"Text info: {info}\n")
    
    coords = braille_to_coords(wrapped, mirror=True)
    print(f"Generated {len(coords)} dots:")
    for i, (x, y) in enumerate(coords[:10]):
        print(f"  Dot {i+1}: ({x:.2f}, {y:.2f})")
    if len(coords) > 10:
        print(f"  ... and {len(coords) - 10} more")
