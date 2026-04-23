# Machine Building Writeup

This was a group project by Caleb Capoccia, Jacob Gokongwei, and Ellie Yin.

We considered several ideas for our machine building project, but given how robust the drawing machine starter kit is, we wanted to spend a lot of time working on a novel end effector. Consequently, wed decided to pursue creating a Braille / tactile art creator. The idea is to put a piece of paper on silicone, foam, or another backing, and then push down with enough force to leave a dent but not break the paper. The imprints would be mirrored of the end product you would actually want, because you would then flip the paper to see the raised markings.

We were initially thinking of using a solenoid to leave the mark given that the press would be in a quick motion. 

![IMG_AFB2007A-DE69-414F-B82C-6A072C4A7674.JPEG](Machine%20Building%20Writeup/IMG_AFB2007A-DE69-414F-B82C-6A072C4A7674.jpeg)

However, after some initial experimentation we realized the solenoids in the lab are too weak. The starter setup uses a servo, so decided to pursue a stronger servo. Given that servos are rotational motion, we decided to pursue a rack and pinion mechanism to deliver the impression.

We then set out with the following to-do list:

- Constructing the entire machine building kit (except for end effector)
- Solder circuit board and fit wiring
- Get the drawing machine working with the start code
- Design and print rack and pinion end effector with rounded hit for pressing that attaches to servo
- Cast silicone
- Refine end effector until leaves desired mark
- Design and print housing for servo and end effector to attach to rails
- Initial code for text to Braille sentences
- Code for converting SVG to Braille-style embossing

## Starter Kit Construction (All)

We followed Bobby’s pre-made drawing machine for a lot of the construction process of our machine. Our solderable breadboard followed the layout of Bobby’s example breadboard closely with minor adjustments (one of the motor drivers were placed one row down). Because we needed a motor with more torque to actually press down onto page with adequate force, we swapped the weaker motor used in the starter kit for a larger TS-51.

## Rack and Pinion Ideation (Jacob)

In order to effectively create imprints in paper for braille text, we needed to use a stronger and larger servo. Thus, I had to completely remake the “pen holder”. We also discussed that a rack and pinion mechanism would be the best way to make braille imprints. We thought the best way to fit pinion onto the drawing machine would be to use the existing servo attachments and design a pinion that could be secured to the attachment.

### Iteration 1

![IMG_6794.HEIC](Machine%20Building%20Writeup/IMG_6794.heic)

[IMG_6795.MOV](Machine%20Building%20Writeup/IMG_6795.mov)

Immediately after the first iteration, I realized that there was a KEY mistake that needed to be fixed with the design. With the design above, there was no place to connect the belt!

### Iteration 2

I put a hole for the belt. However, as usual there was another problem: the rack was too unstable when it moved up and down and this meant it wasn’t meshing with the pinion gear as well as possible. The belt was also threaded through the rack as it moved up and down so visually this didn’t look very nice.

![IMG_6857.HEIC](Machine%20Building%20Writeup/IMG_6857.heic)

### Iteration 3

In this iteration, I put the rack on the opposite side of where the belt attached to the holder. I also included more holes where screws could be inserted for additional stability. Lastly, I modified the rack such that the end effector could be slotted in and out.

[https://youtube.com/shorts/opePP9iCh7o?feature=share](https://youtube.com/shorts/opePP9iCh7o?feature=share)

### Iteration 4

We realized though that the slot would prevent the plate from fully pressing down, so we reprinted the longer rack with a hole for a magnet, and that seemed to do the trick! We also added a clip piece clip onto the servo so that the larger servo would reach the limit switch without running into the belt.

![IMG_9710.jpg](Machine%20Building%20Writeup/IMG_9710.jpg)

[New servo holder v2.stl](Machine%20Building%20Writeup/New_servo_holder_v2.stl)

![IMG_9711.jpg](Machine%20Building%20Writeup/IMG_9711.jpg)

![IMG_9715.jpg](Machine%20Building%20Writeup/IMG_9715.jpg)

## Silicone Mold (Ellie)

- We knew we needed to make a larger silicone mat that could hold a white printer sheet, so we measured out the right dimensions in cardboard to create a temporary box to pour the silicone solution into. After pouring it, there were minor leakage problems, and unfortunately there was no more paper towels. Luckily, Jessica came to my rescue and brought a bunch from the bathroom!
    - The leakage problems were patched with hot glue, which is how I created the box after cutting out the rectangles and assembling it.

After removing the cardboard, the mold came out quite nicely!

![IMG_9551.jpg](Machine%20Building%20Writeup/IMG_9551.jpg)

![IMG_9554.jpg](Machine%20Building%20Writeup/IMG_9554.jpg)

## Braille Press Ideation (Caleb)

We spent a bit of time working out the mechanics of the actual press that would attach to the end of the rack and pinion to make the braille press.

Given that braille dots are 1.5 mm in diameter, I designed and 3D printed an end piece that ended in a 1.5 mm tip.

[STL VIEWER]

[Initial_Press.stl](Machine%20Building%20Writeup/Initial_Press.stl)

![IMG_9520.jpg](Machine%20Building%20Writeup/IMG_9520.jpg)

As you can see above, the first print failed (right), but even after I got it to work (left), the 1.5 mm section was too flimsy to press into paper. Even after slightly increasing the diameter, making the last section of the piece much shorter, and sanding to remove the 3D printed layering, pressing into the paper would make cuts as opposed to imprints. 

![IMG_9521.jpg](Machine%20Building%20Writeup/IMG_9521.jpg)

To get a consistent surface, I experimented with small 3 mm metal balls, and by pressing my thumb into the construction paper, I was able to leave a nice indent. Consequently, I thought that we could attach the ball to a metal dowel that could attach to the rack and pinion. I first tried soldering the ball, but the led solder easily slid off the aluminum dowel.

![IMG_9505.jpg](Machine%20Building%20Writeup/IMG_9505.jpg)

I then tried gluing the ball on, but the ball had trouble staying centered, and when pressing into the paper, the ball still tore through.

I figured it might be because all the pressure was being applied across a small surface area, so was too concentrated and more likely to pierce through. After all, when I used my thumb, which had more surface area, it was easier to modulate the force applied.

Consequently, I shifted to a new approach: I would use a square surface area to press the ball into the paper. However, how would I ensure the ball would stay centered in the same place? I made measurements of the ball and designed a thin plate with a divot for the ball (addressing the centering) and with a hole to place a magnet into, which would hold the ball into place.

[STL VIEWER]

[Plate.stl](Machine%20Building%20Writeup/Plate.stl)

![IMG_9542.jpg](Machine%20Building%20Writeup/IMG_9542.jpg)

![IMG_9543.jpg](Machine%20Building%20Writeup/IMG_9543.jpg)

![IMG_9544.jpg](Machine%20Building%20Writeup/IMG_9544.jpg)

![IMG_9545.jpg](Machine%20Building%20Writeup/IMG_9545.jpg)

![IMG_9546.jpg](Machine%20Building%20Writeup/IMG_9546.jpg)

Using my thumb to press the plate into the paper against a silicone mold, the ball left a nice 3 mm dot on the other end. I was thrilled! I put the plate under the R&P, now attached to the machine, to press into the paper and ran the code for the servo, Instead of pushing down, it just pushed the machine rails up. Even if we adjusted the gear ratio, because of the rails, the force would likely continue to push the rails up, as opposing to pressing into the paper.

I was a bit bummed, because I had spent a lot of time iterating to get to the plate idea, and we had built the R&P and cast the silicone so that we could get a nice press for the braille. Even though it wouldn’t be as satisfying, to still pursue an approach in a similar ballpark, I decided to drill press a hole into the rack to screw in a small knife, which against the silicone could punch holes through paper and could still create a tactile type of art.

![IMG_9549.jpg](Machine%20Building%20Writeup/IMG_9549.jpg)

![IMG_9558.jpg](Machine%20Building%20Writeup/IMG_9558.jpg)

I switched to printer paper now that we no longer needed the paper to be firm enough to withstand breaking, but the holes the knife made were so thin you could barely see them. Nathan suggested looking at trill bits, which would be a bit more cylindrical. For some reason, I decided to stop and try the plate one more time, this time now with the printer paper, and to my happy surprise, it left an imprint without breaking through!

![IMG_9568.jpg](Machine%20Building%20Writeup/IMG_9568.jpg)

![IMG_9548.jpg](Machine%20Building%20Writeup/IMG_9548.jpg)

![IMG_9547.jpg](Machine%20Building%20Writeup/IMG_9547.jpg)

I gorilla glued the plate to the rack, and even though I needed to hold down the machine against the temporary wood platform and hold the rack against the pinion so that it wouldn’t wobble, I was able to get consistent braille-like dots. We were back in business!

![IMG_9576.jpg](Machine%20Building%20Writeup/IMG_9576.jpg)

![IMG_9573.jpg](Machine%20Building%20Writeup/IMG_9573.jpg)

As noted in the R&P section, we added a magnet to the rack so that you could hypothetically swap out the end plates for different sized braille!

![IMG_9738.jpg](Machine%20Building%20Writeup/IMG_9738.jpg)

## Machine Frame (Ellie)

I used the frame from the fusion file of the starter drawing machine kit to CNC mill the two blocks on MDF material and screwed them in. 

There was some issues with how to secure them on since there were no wood screws that were wide enough and the right length to cover the size of the holes on the blocks and the starter kit parts, but there was also not support for a nut in the MDF blocks. I fixed this by drilling a shallow hole a few millimeters into the base of the block where I needed to put in a screw, and screwing in a nut to pull it up until the block to get stuck. Then, I assembled the actual parts that needed to be screwed down and screwed them in, securing the entire assembly. 

![IMG_9737.jpg](Machine%20Building%20Writeup/IMG_9737.jpg)

## Code (Caleb)

I used Windsurf to accelerate the development of code and for code documentation, given that designing the end effector took a significant amount of time. Additionally, if you view the full commit history on my [week-10 branch](https://github.com/calebcapoccia/ps70/tree/week-10), you will see that the code entailed significant iteration, even with generative AI tooling.

### Arduino Code

I used the initial drawing code as a baseline, but modified it to accept structured text commands in order to make the dot presses. I also changed the connection to use a hypothetical, definitely-does-not-exist, stable WiFi connection in the maker space and then running a frontend locally, as opposed to hosting the frontend on the Arduino, which required joining the the Arduino’s WiFi server.

[DOWNLOAD FOR ARDUINO CODE]

### Frontend

I used a Flask architecture with JavaScript for the frontend and Python for the backend. It has text-to-Braille conversion with automatic word wrapping, manual drawing mode with grid snapping, a precision test pattern generator, path optimization using nearest-neighbor algorithm to minimize travel distance, mirror mode for flip-over embossing, real-time progress tracking via HTTP polling, and WebSocket communication with the ESP32 microcontroller.

After I completed a working version with Flask, I decided that for the pun I wanted to convert the interface to the web framework Ruby on Rails, simply so that we could name the project "**Ruby on Brailles**." The architectural changes were significant: I replaced the simple HTTP polling system with Rails Action Cable for real-time bidirectional WebSocket communication between the frontend and backend, implemented a background job system using ActiveJob to continuously monitor ESP32 progress without blocking HTTP requests, migrated from Python's websocket library to Ruby's faye-websocket gem with EventMachine for more reliable WebSocket frame parsing and non-blocking I/O, converted the Python Braille converter and path optimizer into Ruby service objects, and restructured the ESP32 connection as a singleton model with a message queue for handling asynchronous responses. The Rails version provides instant progress updates pushed to all connected clients through Action Cable instead of requiring the frontend to repeatedly poll the server, making the interface more responsive and reducing unnecessary network traffic.

You can find the full code in the [week 10 directory](https://github.com/calebcapoccia/ps70/tree/main/10_machine), and the rails code specifically in the rails_server folder.

![image.png](Machine%20Building%20Writeup/image.png)

![image.png](Machine%20Building%20Writeup/image%201.png)

## Setup and Demo: Ruby on Brailles

#### 1. Arduino Setup

```bash
# 1. Create secrets.h from template
cp secrets.h.template secrets.h

# 2. Edit secrets.h with your WiFi credentials
# Add your SSID and password

# 3. Upload braille_machine.ino to ESP32
# - Open in Arduino IDE
# - Select board: ESP32C3 Dev Module
# - Upload code
# - Open Serial Monitor to see IP address
```

#### 2. Physical Setup

**Adjust plate height**: Ensure the embossing plate is positioned 10mm above the silicone surface for proper dot formation.

**Place paper over silicone:** Use push pins to hold the paper properly in space after covering the silicone bed.

#### 3. Start Rails Server

```bash
cd rails_server
bundle install
bin/rails server
```

Server runs at `http://localhost:3000`

#### 4. Connect and Use

1. **Open browser** to `http://localhost:3000`
2. **Connect to ESP32**: Enter the IP address from Serial Monitor
3. **Home the machine**: Click "Home" button (runs automatically on startup)
4. **Create Braille**:
    - Enter text in the text box
    - Click "Convert to Braille"
    - Click "Send to Machine"
5. **Watch it run**: Progress bar shows real-time execution

#### Quick Test

For a quick test without text conversion:

- Switch to "Manual Drawing" mode
- Click dots on the grid
- Click "Send to Machine"

[https://youtu.be/zcdPaVsdhT0](https://youtu.be/zcdPaVsdhT0)