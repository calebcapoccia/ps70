class PathOptimizer
  def self.distance(p1, p2)
    Math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)
  end

  def self.optimize_dots(dots, start_pos: [0, 0])
    return dots if dots.length <= 1

    dots = dots.map { |(x, y)| [x.to_f, y.to_f] }

    optimized = []
    remaining = dots.dup
    current = start_pos

    while remaining.any?
      closest = remaining.min_by { |dot| distance(current, dot) }
      optimized << closest
      remaining.delete(closest)
      current = closest
    end

    optimized
  end

  def self.calculate_total_distance(dots, start_pos: [0, 0])
    return 0 if dots.empty?

    total = distance(start_pos, dots[0])
    (0...dots.length - 1).each do |i|
      total += distance(dots[i], dots[i + 1])
    end

    total
  end

  def self.compare_optimization(original_dots, optimized_dots, start_pos: [0, 0])
    original_dist = calculate_total_distance(original_dots, start_pos: start_pos)
    optimized_dist = calculate_total_distance(optimized_dots, start_pos: start_pos)

    savings = original_dist > 0 ? ((original_dist - optimized_dist) / original_dist) * 100 : 0

    {
      original_distance: original_dist.round(2),
      optimized_distance: optimized_dist.round(2),
      savings_percent: savings.round(1),
      savings_mm: (original_dist - optimized_dist).round(2)
    }
  end
end
