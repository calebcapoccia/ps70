require 'socket'
require 'websocket'
require 'singleton'

class Esp32Connection
  include Singleton

  attr_reader :connected, :ip

  def initialize
    @socket = nil
    @handshake = nil
    @connected = false
    @ip = nil
  end

  def connect(ip)
    begin
      ws_url = "ws://#{ip}/ws"
      Rails.logger.info "Connecting to ESP32 at #{ws_url}..."

      # Parse URL
      uri = URI.parse(ws_url)
      
      # Create TCP socket
      @socket = TCPSocket.new(uri.host, uri.port || 80)
      @socket.setsockopt(Socket::SOL_SOCKET, Socket::SO_KEEPALIVE, true)
      
      # Perform WebSocket handshake
      @handshake = WebSocket::Handshake::Client.new(url: ws_url)
      @socket.write(@handshake.to_s)
      
      # Read handshake response
      response = ""
      while line = @socket.gets
        response += line
        break if line == "\r\n"
      end
      
      @handshake << response
      
      unless @handshake.finished?
        raise "WebSocket handshake failed"
      end
      
      @connected = true
      @ip = ip
      
      Rails.logger.info "✓ Connected to ESP32 at #{ip}"
      
      # Try to receive initial message
      begin
        Timeout.timeout(1) do
          frame = receive_frame
          Rails.logger.info "← Received from ESP32: #{frame}" if frame
        end
      rescue Timeout::Error
        # No initial message, that's okay
      end
      
      return true
    rescue => e
      Rails.logger.error "✗ Failed to connect to ESP32: #{e.message}"
      @connected = false
      if @socket
        begin
          @socket.close
        rescue
        end
      end
      @socket = nil
      @handshake = nil
      return false
    end
  end

  def disconnect
    if @socket
      begin
        @socket.close
      rescue => e
        Rails.logger.error "Error closing WebSocket: #{e.message}"
      end
    end

    @socket = nil
    @handshake = nil
    @connected = false
    @ip = nil
  end

  def send_command(command)
    unless @connected && @socket
      return { success: false, error: "Not connected to ESP32" }
    end

    begin
      frame = WebSocket::Frame::Outgoing::Client.new(version: @handshake.version, data: command, type: :text)
      @socket.write(frame.to_s)
      Rails.logger.info "→ Sent to ESP32: #{command}"
      
      sleep(0.05)
      
      { success: true, response: nil }
    rescue => e
      Rails.logger.error "✗ Error sending to ESP32: #{e.message}"
      @connected = false
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

  private

  def receive_frame
    return nil unless @socket

    frame = WebSocket::Frame::Incoming::Client.new(version: @handshake.version)
    
    while !frame.next
      data = @socket.readpartial(1024)
      frame << data
    end
    
    frame.data
  rescue
    nil
  end
end
