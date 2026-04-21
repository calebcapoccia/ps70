class BrailleConverter
  BRAILLE = {
    'A' => [1], 'B' => [1,2], 'C' => [1,4], 'D' => [1,4,5], 'E' => [1,5],
    'F' => [1,2,4], 'G' => [1,2,4,5], 'H' => [1,2,5], 'I' => [2,4], 'J' => [2,4,5],
    'K' => [1,3], 'L' => [1,2,3], 'M' => [1,3,4], 'N' => [1,3,4,5], 'O' => [1,3,5],
    'P' => [1,2,3,4], 'Q' => [1,2,3,4,5], 'R' => [1,2,3,5], 'S' => [2,3,4], 'T' => [2,3,4,5],
    'U' => [1,3,6], 'V' => [1,2,3,6], 'W' => [2,4,5,6], 'X' => [1,3,4,6], 'Y' => [1,3,4,5,6],
    'Z' => [1,3,5,6],
    '0' => [3,4,5,6], '1' => [2], '2' => [2,3], '3' => [2,5], '4' => [2,5,6],
    '5' => [2,6], '6' => [2,3,5], '7' => [2,3,5,6], '8' => [2,3,6], '9' => [3,5],
    ' ' => [],
    '.' => [4,6], ',' => [6], '!' => [2,3,5], '?' => [2,3,6]
  }.freeze

  WORK_WIDTH = 170
  WORK_HEIGHT = 250
  DOT_SIZE = 3
  DOT_SPACING = 5
  CELL_WIDTH = 17
  LINE_HEIGHT = 28
  MAX_CHARS_PER_LINE = 10
  MAX_LINES = 8

  def self.braille_to_coords(text, start_x: 10, start_y: 10, mirror: true)
    coords = []
    line_length = 0
    current_line = 0

    text.upcase.each_char do |char|
      if char == "\n"
        current_line += 1
        line_length = 0
        next
      end

      if line_length >= MAX_CHARS_PER_LINE
        current_line += 1
        line_length = 0
      end

      break if current_line >= MAX_LINES

      unless BRAILLE.key?(char)
        line_length += 1 unless char == ' '
        next
      end

      cell_x = start_x + (line_length * CELL_WIDTH)
      cell_y = start_y + (current_line * LINE_HEIGHT)

      BRAILLE[char].each do |dot|
        col = [1, 2, 3].include?(dot) ? 0 : 1
        row = (dot - 1) % 3

        x = cell_x + (col * DOT_SPACING)
        y = cell_y + (row * DOT_SPACING)

        if x <= WORK_WIDTH - DOT_SIZE && y <= WORK_HEIGHT - DOT_SIZE
          coords << [x, y]
        end
      end

      line_length += 1
    end

    if mirror
      coords.map { |(x, y)| [WORK_WIDTH - x, y] }
    else
      coords
    end
  end

  def self.get_text_info(text)
    lines = 1
    current_line_length = 0
    total_chars = 0

    text.upcase.each_char do |char|
      if char == "\n"
        lines += 1
        current_line_length = 0
        next
      end

      if BRAILLE.key?(char)
        total_chars += 1
        current_line_length += 1

        if current_line_length >= MAX_CHARS_PER_LINE
          lines += 1
          current_line_length = 0
        end
      end
    end

    {
      total_chars: total_chars,
      lines: lines,
      fits: lines <= MAX_LINES && total_chars > 0,
      max_chars: MAX_CHARS_PER_LINE * MAX_LINES
    }
  end

  def self.word_wrap(text, max_chars_per_line: MAX_CHARS_PER_LINE)
    words = text.split
    lines = []
    current_line = []
    current_length = 0

    words.each do |word|
      word_length = word.length

      if current_length + word_length + current_line.length > max_chars_per_line
        if current_line.any?
          lines << current_line.join(' ')
          current_line = [word]
          current_length = word_length
        else
          lines << word[0...max_chars_per_line]
          current_line = []
          current_length = 0
        end
      else
        current_line << word
        current_length += word_length
      end
    end

    lines << current_line.join(' ') if current_line.any?
    lines.join("\n")
  end
end
