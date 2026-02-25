# More

### Another Extension

One thing still didn’t sit right with me: the 100 ms delay in the loop. Thus, after the Week 5 lab, I decided to refactor the entire Arduino file to use a class-based approach to eliminate any latency that the delay introduced. I created classes for the goal and goalie, as those are the two “units” I see in this system.

```jsx
const int A1A = D0;
const int A1B = D1;
const int leftButtonPin = D2;
const int rightButtonPin = D3;
const int buzzerPin = D4;
const int trigPin = D5;
const int echoPin = D6;

class Goalie{
  // Member variables
  int a1;
  int b1;
  int leftButton;
  int rightButton;

  public:
    Goalie(int setA, int setB, int setLeft, int setRight) {
      // Assign member variables
      a1 = setA;
      b1 = setB;
      leftButton = setLeft;
      rightButton = setRight;
    }

    void begin() {
      // Declare pins
      pinMode(a1, OUTPUT);
      pinMode(b1, OUTPUT);
      pinMode(leftButton, INPUT_PULLUP);
      pinMode(rightButton, INPUT_PULLUP);

      // Start with motors off
      digitalWrite(a1, LOW); 
      digitalWrite(b1, LOW);
    }

    void controlGoalie() {
      // Read button values
      int leftVal = digitalRead(leftButtonPin);
      int rightVal = digitalRead(rightButtonPin);

      // If both buttons are pressed or if neither is pressed, stop the motor
      if ((leftVal == LOW && rightVal == LOW) || (leftVal == HIGH && rightVal == HIGH)) {
        digitalWrite(A1A, LOW);
        digitalWrite(A1B, LOW);
      }

      // Left button pressed, move counter-clockwise
      else if (leftVal == LOW && rightVal == HIGH) {
        digitalWrite(A1A, HIGH);
        digitalWrite(A1B, LOW);
      }

      // Right button pressed, move clockwise
      else {
        digitalWrite(A1A, LOW);
        digitalWrite(A1B, HIGH); 
      }
    }
};

class Goal{
  // Member variables
  int trig;
  int echo;
  int buzzer;
  unsigned long delayTime;
  unsigned long previousMillis;

  public:
    Goal(int setTrig, int setEcho, int setBuzzer) {
      // Set up member variables
      trig = setTrig;
      echo = setEcho;
      buzzer = setBuzzer;
    }

    void begin() {
      // Declare pins
      pinMode(trig, OUTPUT);
      pinMode(echo, INPUT);

      // Start with trig off
      digitalWrite(trig, LOW);

      previousMillis = millis();
    }

    void runSensor(long setDelay) {
      delayTime = setDelay;

      // Get current time
      unsigned long currentMillis = millis();

      // Check if it is time to receive signal
      if ((currentMillis - previousMillis) >= delayTime) {
        // Send pulse
        digitalWrite(trig, LOW);
        delayMicroseconds(2);
        digitalWrite(trig, HIGH);
        delayMicroseconds(8);
        digitalWrite(trig, LOW);

        // Receive signal
        float duration = pulseIn(echo, HIGH);
        float distance = (duration*.0343)/2 * 10; // Get distance in mm
        Serial.println(duration);

        // If an object is detected in the net
        if (distance < 80 || distance > 1000) {
          // Ring the buzzer
          tone(buzzer, 2000);
        }
        else {
          // Turn the buzzer off
          noTone(buzzer);
        }

        // Log time and update state
        previousMillis = currentMillis;
      }
    } 
};

// Initialize goalie and goal
Goalie bobby(A1A, A1B, leftButtonPin, rightButtonPin);
Goal goal(trigPin, echoPin, buzzerPin);

void setup() {
  bobby.begin();
  goal.begin();
}

void loop() {
  // Control goalie
  bobby.controlGoalie();

  // Send and receive signal after delay of 100 ms
  goal.runSensor(100);
}
```

I added the begin methods because while testing, I ran into issues where the goalie ran, but the goal didn’t, and an AI debugging tool explained it might be because C++ constructors could be called before the hardware is ready, so pinMode is called before the pin is ready. Thus, by saving this action to run during setup, we are guaranteeing the hardware is ready.