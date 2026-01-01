from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
import subprocess
import models, auth, schemas

router = APIRouter()

@router.post("/vpn/regenerate")
async def regenerate_vpn_config(current_user: models.User = Depends(auth.get_current_user)):
    username = current_user.username
    easyrsa_path = "/usr/local/bin/easyrsa"

    
    try:
       
        subprocess.run(
            ["docker", "exec", "openvpn_server", "rm", "-f", f"/etc/openvpn/pki/private/{username}.key", f"/etc/openvpn/pki/reqs/{username}.req", f"/etc/openvpn/pki/issued/{username}.crt"],
            check=False, capture_output=True
        )
        
        #  generate again
        subprocess.run(
            ["docker", "exec", "--workdir", "/etc/openvpn", "openvpn_server", easyrsa_path, "build-client-full", username, "nopass"],
            check=True, capture_output=True, text=True, timeout=30
        )
        
        return {"message": "VPN configuration regenerated successfully. You can now download the new config."}
        
    except subprocess.CalledProcessError as e:
        print(f"Error regenerating VPN certificate: {e.stderr}")
        raise HTTPException(status_code=500, detail=f"Error regenerating VPN certificate: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.get("/vpn/status")
async def get_vpn_status(current_user: models.User = Depends(auth.get_current_user)):
    username = current_user.username
    try:
        #  OpenVPN status log
        result = subprocess.run(
            ["docker", "exec", "openvpn_server", "cat", "/tmp/openvpn-status.log"],
            check=True, capture_output=True, text=True, timeout=5
        )
        status_log = result.stdout
        
       
        is_connected = f",{username}," in status_log or f"{username}," in status_log 
        
        return {"connected": is_connected}
    except subprocess.CalledProcessError:
        return {"connected": False}
    except Exception as e:
        print(f"Error checking VPN status: {e}")
        return {"connected": False}

@router.post("/vpn/generate-config")
async def generate_vpn_config(current_user: models.User = Depends(auth.get_current_user)):
    username = current_user.username
    easyrsa_path = "/usr/local/bin/easyrsa" 

    # Generate the client certificate if it doesn't exist
    try:
        subprocess.run(
            ["docker", "exec", "--workdir", "/etc/openvpn", "openvpn_server", easyrsa_path, "build-client-full", username, "nopass"],
            check=True, capture_output=True, text=True, timeout=30
        )
    except subprocess.CalledProcessError as e:
        if "Request file already exists." in e.stderr or ("An client certificate with the name" in e.stderr and "already exists" in e.stderr):
            pass
        else:
            print(f"Error creating VPN certificate: {e.stderr}")
            raise HTTPException(status_code=500, detail=f"Error creating VPN certificate: {e.stderr}")

    # Retrieve the client configuration
    try:
        result = subprocess.run(
            ["docker", "exec", "--workdir", "/etc/openvpn", "openvpn_server", "ovpn_getclient", username],
            check=True, capture_output=True, text=True, timeout=30
        )
        config_data = result.stdout
        return PlainTextResponse(content=config_data, media_type="application/octet-stream", headers={"Content-Disposition": f"attachment; filename={username}.ovpn"})
    except subprocess.CalledProcessError as e:
        print(f"Error generating VPN config: {e.stderr}")
        raise HTTPException(status_code=500, detail=f"Error generating VPN config: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
