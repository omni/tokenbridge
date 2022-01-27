from web3 import Web3

'''
Variables
'''
# accounts
#addr = "0xB7B286b5a4a9004Ef972864469A0C49E35B505E4" # Account 1
#privKey = "9f075c2be423a7d76a7b784aa257034475ac8e5c5a8cb817fde176b266f835c5" # Account 1
addr = ""
privKey = ""
addr2 = "" # M1
privKey2 = "" # M1

# contracts
#quorum20Addr = "0x06d529d393111A6332A7b9ac0E0DC65f1e5016f5" # erc20 contract on foreign chain
#ropsten677Addr = Web3.toChecksumAddress("0x0a3205d1754f7B0d9d8b372E5435D21c59348992") # single-ropsten
quorum20Addr = "0x8bA54E3309577be16B0C7E2973CF90d67328158c" # erc20 on Taisys quorum
# ropsten677Addr = Web3.toChecksumAddress("0x945A087D647E73Dd55fcF9c5b3C90BDe0555B24F") # taisys-ropsten
ropsten677Addr = Web3.toChecksumAddress("0xa1765940dccDaC254Fa20dE4641E3400f17b7fa9") # taisys-polygon


#quorumMedAddr = Web3.toChecksumAddress("0x3C06303D4e3de90A1A66aA79AD85633f213C011A") # mediator at foriegn
#ropstenMedAddr = Web3.toChecksumAddress("0x02c426Be105918B48D670f24da894A3807684825") # mediator(ambe2e) at home
# quorumMedAddr = Web3.toChecksumAddress("0x4c953E7670ABffc3b310f19e54B02Bf29D6eb775") #ts-rp
# ropstenMedAddr = Web3.toChecksumAddress("0x4c953E7670ABffc3b310f19e54B02Bf29D6eb775") #ts-rp
quorumMedAddr = Web3.toChecksumAddress("0x9E49071ED3297575f484296c25DEa1f04C590b14") #ts-pg
ropstenMedAddr = Web3.toChecksumAddress("0xBac397F5020B1699434b95aF452ef0ce87e8fCC9") #ts-pg

#quorumBriAddr = "0x98893E79075102f7EBb48A94efF4E0D1505e61F9"
#ropstenBriAddr = "0x49F11977585f9aec25A28509B4F2C5faCe040FDe"
# quorumBriAddr = "0xd0EeaA347EDecB6b69D176008955354b6b9A9Eb5" #ts-rp
# ropstenBriAddr = "0xd0EeaA347EDecB6b69D176008955354b6b9A9Eb5" #ts-rp
quorumBriAddr = "0x974705E969381e75Cd248EF0A31EF9A3bea80123" #ts-pg
ropstenBriAddr = "0x959992B4b392f9e231D37b093aEbCfECe9314cd6" #ts-pg

quorumValAddr = "0x241e3F76701600E2560E32e9A437D14a9B685ecD"
ropstenValAddr = "0x241e3F76701600E2560E32e9A437D14a9B685ecD"

# provider
quorumProvider = "https://node.taisys.dev/taisys/rpc"
quorumNonce = 1000
#quorumProvider = "https://071b-155-4-14-124.ngrok.io"
#quorumNonce = 10
# ropstenProvider = "https://ropsten.infura.io/v3/5b3e6a6f546f478eaf60bb110825f4dc"
# ropstenNonce = 3
ropstenProvider = "https://polygon-mainnet.g.alchemy.com/v2/GebhSHHQxe9_0GYA0k63bEe1Gp_fk1eX"
ropstenNonce = 137
