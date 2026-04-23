require 'faye/websocket'
require 'eventmachine'
require 'singleton'

class Esp32Connection
  include Singleton

  attr_reader :connected, :ip

  def initialize
    @ws = nil
    @connected = false
    @ip = nil
    @message_queue = Queue.new
    @em_thread = nil
  end

  def connect(ip)
    disconnect if @connected

    @ip = ip
    ws_url = "ws://#{ip}/ws"
    Rails.logger.info "Connecting to ESP32 at #{ws_url}..."

    begin
      # Start EventMachine in a separate thread
      @em_thread = Thread.new do
        EM.run do
          @ws = Faye::WebSocket::Client.new(ws_url)

          @ws.on :open do |event|
            Rails.logger.info "✓ Connected to ESP32 at #{ip}"
            @connected = true
          end

          @ws.on :message do |event|
            message = event.data
            Rails.logger.info "← Received: #{message}"
            @message_queue << message
          end

          @ws.on :close do |event|
            Rails.logger.warn "WebSocket closed: #{event.code} #{event.reason}"
            @connected = false
            @ws = nil
          end

          @ws.on :error do |event|
            Rails.logger.error "WebSocket error: #{event.message}"
            @connected = false
          end
        end
      end

      # Wait for connection
      sleep 0.5
      @connected
    rescue => e
      Rails.logger.error "Failed to connect: #{e.message}"
      false
    end
  end

  def disconnect
    if @ws
      @ws.close
      @ws = nil
    end
    
    if @em_thread
      EM.stop if EM.reactor_running?
      @em_thread.kill
      @em_thread = nil
    end
    
    @connected = false
    @message_queue.clear
    Rails.logger.info "Disconnected from ESP32"
  end

  def send_command(command)
    unless @connected && @ws
      return { success: false, error: "Not connected" }
    end

    begin
      @ws.send(command)
      Rails.logger.info "→ Sent: #{command}"
      sleep(0.05)
      { success: true }
    rescue => e
      Rails.logger.error "Error sending command: #{e.message}"
      { success: false, error: e.message }
    end
  end

  def check_progress
    unless @connected
      return { success: false, error: "Not connected" }
    end

    begin
      # Check if there are any messages in the queue
      messages = []
      while !@message_queue.empty?
        messages << @message_queue.pop(true) rescue nil
      end

      latest_progress = nil

      messages.compact.each do |message|
        Rails.logger.debug "📬 Processing message: #{message.inspect}"

        if message.start_with?("PROGRESS,")
          parts = message.split(',')
          if parts.length == 3
            latest_progress = {
              success: true,
              status: "running",
              current: parts[1].to_i,
              total: parts[2].to_i
            }
            Rails.logger.info "✅ Progress: #{latest_progress[:current]}/#{latest_progress[:total]}"
          end
        elsif message == "COMPLETE"
          Rails.logger.info "🎉 Complete!"
          return {
            success: true,
            status: "complete"
          }
        elsif message == "READY"
          Rails.logger.debug "ℹ️  Ready message"
        elsif message == "BUSY"
          latest_progress = {
            success: true,
            status: "busy"
          }
        end
      end

      latest_progress || { success: true, status: "no_update" }
    rescue => e
      Rails.logger.error "Error checking progress: #{e.message}"
      { success: false, error: e.message }
    end
  end

  def connected?
    @connected
  end

  def status
    {
      connected: @connected,
      ip: @ip
    }
  end
end
