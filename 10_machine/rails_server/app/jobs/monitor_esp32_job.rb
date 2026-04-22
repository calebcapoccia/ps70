class MonitorEsp32Job < ApplicationJob
  queue_as :default

  def perform
    esp32 = Esp32Connection.instance
    
    unless esp32.connected?
      Rails.logger.warn "⚠️  MonitorEsp32Job: ESP32 not connected"
      return
    end

    Rails.logger.info "🔍 MonitorEsp32Job: Starting to monitor ESP32 progress"
    
    # Monitor for up to 5 minutes
    timeout = Time.now + 5.minutes
    
    while Time.now < timeout
      result = esp32.check_progress
      
      if result[:success]
        # Broadcast progress to all connected clients
        if result[:status] == "running" && result[:current]
          ActionCable.server.broadcast("machine_progress", {
            status: "running",
            current: result[:current],
            total: result[:total]
          })
          Rails.logger.info "📡 Broadcasting progress: #{result[:current]}/#{result[:total]}"
        elsif result[:status] == "complete"
          ActionCable.server.broadcast("machine_progress", {
            status: "complete"
          })
          Rails.logger.info "📡 Broadcasting completion"
          break
        end
      else
        Rails.logger.error "❌ Error checking progress: #{result[:error]}"
        break
      end
      
      # Wait before next check
      sleep 0.5
    end
    
    Rails.logger.info "🏁 MonitorEsp32Job: Finished monitoring"
  end
end
