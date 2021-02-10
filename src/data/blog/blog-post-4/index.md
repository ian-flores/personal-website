---
category: 'blog'
cover: './cover.jpg'
title: 'Deploying NFS for High Availability Deployments of RStudio Pro Products'
description: ''
date: '2021-01-08'
tags: ['RStudio', 'Cloud Deployments']
published: true
---

One of the requirements of High Availability deployments with RStudio Pro products is the establishment of a shared storage mount. For our products we strongly suggest the **Network File System** protocol, commonly known as **NFS**.

To set up an NFS infrastructure that includes a host instance and multiple client instances, you have to

* Configure an NFS server to run on the host instance.
* Configure RStudio Pro products to run on the client instances. 


![](cover.jpg)


## Provision the NFS Server Instance

Step 1 is to set up an instance that hosts the NFS server. This can be a virtual machine if you do not want to install it on hardware.

When you provision this machine, you need to consider how big the instance should be, and specifically the size of the attached storage disk.  Make sure you pick a disk size that is larger than your anticipated data storage needs. As an example of this, the minimum suggested disk space for RStudio Package Manager is 100+ GB (more info available on the Admin Guide). We suggest that an NFS server for this product have at least double this amount. Take into consideration if you are using the NFS server for only one product or for all of the products in your environment.

You also have to create a set of firewall rules to allow inbound traffic, including SSH on port 22 and NFS connections on port 2049.

## Provision the NFS Client Instances

Step 2 is to set up the virtual machine instances that host the RStudio Pro product servers and act as NFS **clients**.

These instances follow an appropriate sizing depending on your environment and requirements. 

For these instances, you create a set of firewall rules to allow inbound traffic to port 22. In addition, to use and access the RStudio Pro product server, you must allow traffic to the appropriate server port, as well.  Which ports you open here will depend on how you have configured the RStudio Pro product servers, but by default they will be:

* Port 8787 for RStudio Server Pro
* Port 3939 for RStudio Connect
* Port 8989 for RStudio Package Manager

You may have configured these products to run on port 80 or port 443, depending on your load balancer, proxy or firewall configurations, so make sure you open the port you are actually using.

## Configure the NFS Server Instance

### 1. Install the NFS kernel server

Once you have all of the instances deployed, log in into your NFS server instance.

Then install the `nfs-kernel-server` package, which includes the necessary components to run an NFS server.

For distributions that use the `apt` package manager, e.g., Ubuntu:


```bash
sudo apt update
sudo apt install nfs-kernel-server
```


For distributions that use the `yum` package manager, e.g., RHEL:


```bash
sudo yum update
sudo yum install nfs-kernel-server
```


Now that `nfs-kernel-server` is installed, you need to specify which directories you are exporting, where you are exporting them to, and what permissions and configurations you are exporting them with.


### 2. Create product directories


First, create the product directories that are required by the RStudio Pro server product you are using. The table below lists which directories you have to create for the server to function correctly. These locations are a suggestion based on the Filesystem Hierarchy Standard, which specifies that the `/srv` directory is the one to be used for data served to specific applications. 

 

| Product | Application Data Directory | Home Directory | Other Directories |
|:--------:|:-----------------------:|:----------------:|:------------------:|
| RStudio Connect | `/srv/nfs/rstudio/rsc/data` | NA | NA |
| RStudio Server Pro | `/srv/nfs/rstudio/rsp/data` | `/srv/nfs/rstudio/rsp/home` | NA |
| RStudio Package Manager | `/srv/nfs/rstudio/rspm/data` | NA | `/srv/nfs/rstudio/rspm/packages` |



When creating the directories for the product data (and other directories that are not the home directory),  use mkdir to create the folder, and then assign the corresponding permissions. For example, to create the data directory for RStudio Connect, execute:


```
sudo mkdir -p /srv/nfs/rstudio/rsc/data
sudo chown -R nobody:nogroup /srv/nfs/rstudio/rsc/data
```


Note that when you create a directory that acts as a home directory for a product, you need to specify a different default HOME directory than /home. 


### 3. Specify user home directories

Next, specify you preferred location for your user home directories.

If you manage users manually, you need to modify the `/etc/default/useradd` file. Inside this file, replace the line that specifies the default HOME directory and replace it with the path you wish to use. 


```
HOME=<DESIRED_HOME_PATH>/user
```


If you manage users with Active Directory, you need to modify the sssd.conf file under the `[domain/<AD_DOMAIN_NAME>]` header and specify the directory you wish to use as default HOME directory:


```
[domain/<AD_DOMAIN_NAME>]

override_homedir = <DESIRED_HOME_PATH>/%u
```


### 4. Export directories

There are multiple options when specifying where to export the directories (which is heavily dependent on your network infrastructure), including:

- Specify the IP mask of the network of the client instances.

For example:


```
/var/nfs_share 10.0.0.0/16(rw,sync,no_root_squash,no_subtree_check)
```


- Specify the IP address of the instances.

For example:


```
/var/nfs_share 10.0.0.1(rw,sync,no_root_squash,no_subtree_check)
```


- Specify the DNS hostname of the instance.

For example:


```
/var/nfs_share client.example.com(rw,sync,no_root_squash,no_subtree_check)
```


These examples specify the export directory, the client address, and the permissions. Specifically,  configure the mount to have read and write permissions (rw), to be synchronous in its file operations (sync), disable subtree checking (no_subtree_check) and disable the root squash feature (no_root_squash).

You need to apply these changes to the `/etc/exports` file. These commands specify:

- which directories to export by the NFS server,
- where to export them,
- and with what permissions.

**Note**: If you are using Kubernetes, specifying the individual addresses of the nodes will not work. This is because for Kubernetes, it is not important where the sessions are being launched and where the pods are running. Instead, specify the IP mask of where the nodes will be provisioned from.

## Restart the NFS Kernel Service

After executing the above steps, restart the `nfs-kernel-server` service so that it can read the new exports: 


```
sudo systemctl restart nfs-kernel-server
```


With this step, you have completed the deployment of the NFS server component.

## Configure NFS Client Instances

You must now set up the client instances. 

Once inside the instance, install the `nfs-common` package. This package contains the necessary tools for this instance to act as an NFS client.

For distributions that use the `apt` package manager, e.g., Ubuntu:


```
sudo apt update
sudo apt install nfs-common
```


For distributions that use `yum` package manager, e.g., RHEL:


```
sudo yum update
sudo yum install nfs-common
```


Then you proceed to mount the host share into your instance:


```
sudo mount <NFS-SERVER-IP>:<EXPORT-DIR> <LOCAL-DIR>
```


To confirm that it mounted correctly,  execute the disk-free command to see your mounts. In the output you see a list of the different mounts and you should see listed the NFS mount mounted on your local directory.


```
df -h
```


In order for the mount to be persistent across reboots, you have to also modify the `/etc/fstab` file to specify the host share and the client mount point. Add the following line to the file:


```
<NFS-SERVER-IP>:<EXPORT-DIR> <LOCAL-DIR> nfs defaults 0 0
```


Repeat the previous section on all other client instances.

## Cloud Provider Equivalents

The suggestions in this document should work on instances from any cloud provider, and are also applicable to on-premises deployments.

|     | Amazon Web Services | Microsoft Azure | Google Cloud Platform |
|:---:|:--------------:|:----------------:|:------------------:|
| Compute Instances | EC2 Instance | Azure VMs | Compute Engine |
| Attached Storage | EBS Volume	Managed Disks | Block Storage |
| Firewall Rules | Security Group | Network Security Groups | Firewall Rules |
 

## Wrapping up

Remember that each product has its own requirements regarding High Availability, and how they interact with NFS. Read more about it in the Admin Guides for each product:

* RStudio Server Pro: https://docs.rstudio.com/ide/server-pro/load-balancing.html
* RStudio Connect: https://docs.rstudio.com/connect/admin/load-balancing/
* RStudio Package Manager: https://docs.rstudio.com/rspm/admin/ha/
