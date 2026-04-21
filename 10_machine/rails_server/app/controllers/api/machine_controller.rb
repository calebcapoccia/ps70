module Api
  class MachineController < ApplicationController
    before_action :esp32_connection

    def connect
      ip = params[:ip]

      if ip.blank?
        render json: { success: false, error: "No IP provided" }, status: :bad_request
        return
      end

      success = @esp32.connect(ip)
      
      if success
        render json: { success: true, ip: ip }
      else
        render json: { success: false, error: "Failed to connect to ESP32. Check IP address and network connection." }
      end
    end

    def disconnect
      @esp32.disconnect
      render json: { success: true }
    end

    def status
      render json: @esp32.status
    end

    def command
      command = params[:command]

      if command.blank?
        render json: { success: false, error: "No command provided" }, status: :bad_request
        return
      end

      result = @esp32.send_command(command)
      render json: result
    end

    def send_dots
      dots = params[:dots] || []
      optimize = params[:optimize].nil? ? true : params[:optimize]

      if dots.empty?
        render json: { success: false, error: "No dots provided" }, status: :bad_request
        return
      end

      original_dots = dots.dup
      dots = PathOptimizer.optimize_dots(dots) if optimize

      @esp32.send_command("CLEAR")
      sleep(0.1)

      dots.each do |x, y|
        command = "DOT,#{'%.2f' % x},#{'%.2f' % y}"
        result = @esp32.send_command(command)
        
        unless result[:success]
          render json: {
            success: false,
            error: "Failed to send dot: #{result[:error]}"
          }, status: :internal_server_error
          return
        end
        
        sleep(0.05)
      end

      result = @esp32.send_command("RUN")

      response = {
        success: true,
        dots_sent: dots.length
      }

      if optimize
        optimization = PathOptimizer.compare_optimization(original_dots, dots)
        response[:optimization] = optimization
      end

      render json: response
    end

    def home
      result = @esp32.send_command("HOME")
      render json: result
    end

    def stop
      result = @esp32.send_command("STOP")
      render json: result
    end

    def clear
      result = @esp32.send_command("CLEAR")
      render json: result
    end

    private

    def esp32_connection
      @esp32 = Esp32Connection.instance
    end
  end
end
