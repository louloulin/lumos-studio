#!/bin/bash

# Check if port 1420 is in use
check_and_kill_port() {
  local PORT=$1
  local PORT_PID=$(lsof -i:$PORT -t 2>/dev/null)

  if [ -n "$PORT_PID" ]; then
    echo "Found process(es) using port $PORT. Attempting to kill..."
    
    # Kill each process using the port
    for PID in $PORT_PID; do
      echo "Killing process $PID"
      kill -9 $PID 2>/dev/null
    done
    
    # Wait a moment to ensure processes are terminated
    sleep 1
    
    # Check if port is still in use
    if [[ -n $(lsof -i:$PORT -t 2>/dev/null) ]]; then
      echo "Failed to kill all processes on port $PORT"
      return 1
    else
      echo "Successfully killed processes using port $PORT"
      return 0
    fi
  else
    echo "No processes found using port $PORT"
    return 0
  fi
}

# Check and kill processes for both ports
check_and_kill_port 1420
check_and_kill_port 1421

exit 0